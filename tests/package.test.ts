import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { dirname, extname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mimeTypes = new Map([
  [".html", "text/html"],
  [".js", "text/javascript"],
  [".json", "application/json"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json"]
]);

async function exec(command: string, args: string[], cwd: string): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd,
      maxBuffer: 1024 * 1024 * 20
    });

    return `${stdout}${stderr}`;
  } catch (error) {
    const failure = error as Error & { stdout?: string; stderr?: string };
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        failure.stdout,
        failure.stderr,
        failure.message
      ]
        .filter(Boolean)
        .join("\n"),
      { cause: error }
    );
  }
}

describe("npm package", () => {
  it("ships static assets, CLI, and worker entry for the deployment template", async () => {
    await exec("pnpm", ["build:package"], repoRoot);
    const packOutput = await exec("npm", ["pack", "--json", "--ignore-scripts"], repoRoot);
    const packJsonStart = packOutput.indexOf("[");
    const packResult = JSON.parse(packOutput.slice(packJsonStart)) as Array<{
      filename: string;
      files: Array<{ path: string }>;
    }>;
    const packageInfo = packResult[0];
    expect(packageInfo).toBeDefined();
    if (!packageInfo) {
      throw new Error("npm pack did not return package metadata.");
    }
    const { filename, files } = packageInfo;
    const packedPaths = files.map((file) => file.path);

    expect(packedPaths).toContain("package/worker.js");
    expect(packedPaths).toContain("package/cli.js");
    expect(packedPaths).toContain("package/static/index.html");
    expect(packedPaths).not.toContain("package/static/services.json");
    expect(packedPaths).not.toContain("config/services.local.yaml");
    expect(packedPaths).not.toContain(".dev.vars");

    const fixture = await mkdtemp(resolve(tmpdir(), "latch-template-"));
    try {
      await writeFile(
        resolve(fixture, "package.json"),
        JSON.stringify(
          {
            type: "module",
            packageManager: "pnpm@11.1.1",
            scripts: {
              build: "latch build --out dist"
            },
            dependencies: {
              "@phyzess/latch": `file:${resolve(repoRoot, filename)}`
            },
            devDependencies: {
              wrangler: "4.90.1"
            },
            pnpm: {
              onlyBuiltDependencies: ["esbuild", "sharp", "workerd"]
            }
          },
          null,
          2
        )
      );
      await writeFile(
        resolve(fixture, "worker.ts"),
        'export { default } from "@phyzess/latch/worker";\nexport type { Env } from "@phyzess/latch/worker";\n'
      );
      await writeFile(
        resolve(fixture, "pnpm-workspace.yaml"),
        ["allowBuilds:", "  esbuild: true", "  sharp: true", "  workerd: true", ""].join("\n")
      );
      await writeFile(
        resolve(fixture, "wrangler.jsonc"),
        JSON.stringify(
          {
            name: "latch-template-fixture",
            compatibility_date: "2026-05-13",
            main: "./worker.ts",
            assets: {
              directory: "./dist",
              binding: "ASSETS",
              run_worker_first: true,
              not_found_handling: "single-page-application"
            },
            kv_namespaces: [
              {
                binding: "LATCH_CONFIG"
              }
            ],
            vars: {
              LATCH_ADMIN_EMAILS: ""
            }
          },
          null,
          2
        )
      );

      await exec("pnpm", ["install"], fixture);
      await exec("pnpm", ["build"], fixture);
      await exec("pnpm", ["exec", "latch", "doctor"], fixture);
      const indexHtml = await readFile(resolve(fixture, "dist/index.html"), "utf8");
      expect(indexHtml).toContain("<latch-app");
      await expect(readFile(resolve(fixture, "dist/services.json"), "utf8")).rejects.toThrow();
      await expectBrokenIconFallbackToHideFailedImage(resolve(fixture, "dist"));
      const dryRunOutput = await exec("pnpm", ["exec", "wrangler", "deploy", "--dry-run"], fixture);
      expect(dryRunOutput).toContain("env.LATCH_CONFIG");
    } finally {
      await rm(fixture, { force: true, recursive: true });
      await rm(resolve(repoRoot, filename), { force: true });
    }
  }, 120_000);
});

async function expectBrokenIconFallbackToHideFailedImage(distRoot: string): Promise<void> {
  const services = [
    {
      id: "mailbox",
      name: "Mailbox",
      url: "https://mailbox.phyzess.me",
      iconUrl: "https://bad.test/icon.png",
      shortcut: "1"
    }
  ];
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname === "/services.json") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(services));
      return;
    }

    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    try {
      const file = await readFile(resolve(distRoot, `.${pathname}`));
      response.writeHead(200, {
        "content-type": mimeTypes.get(extname(pathname)) ?? "application/octet-stream"
      });
      response.end(file);
    } catch {
      response.writeHead(404);
      response.end("not found");
    }
  });

  try {
    await new Promise<void>((resolveListen) => {
      server.listen(0, "127.0.0.1", resolveListen);
    });
    const { port } = server.address() as AddressInfo;
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.route("https://bad.test/**", (route) => route.abort());
      await page.goto(`http://127.0.0.1:${port}`);
      await page.waitForFunction(() => {
        const root = document.querySelector("latch-app")?.shadowRoot;
        const image = root?.querySelector<HTMLImageElement>(".service-icon-image");
        return image?.hidden === true;
      });

      const iconState = await page.evaluate(() => {
        const root = document.querySelector("latch-app")?.shadowRoot;
        const image = root?.querySelector<HTMLImageElement>(".service-icon-image");
        if (!image) {
          throw new Error("Expected a service icon image.");
        }
        const fallback = image.nextElementSibling as HTMLElement | null;
        if (!fallback) {
          throw new Error("Expected a fallback service icon.");
        }
        const imageBox = image.getBoundingClientRect();
        return {
          fallbackHidden: fallback.hidden,
          imageDisplay: getComputedStyle(image).display,
          imageHeight: imageBox.height,
          imageWidth: imageBox.width
        };
      });

      expect(iconState).toEqual({
        fallbackHidden: false,
        imageDisplay: "none",
        imageHeight: 0,
        imageWidth: 0
      });
    } finally {
      await browser.close();
    }
  } finally {
    await new Promise<void>((resolveClose, rejectClose) => {
      server.close((error) => {
        if (error) {
          rejectClose(error);
          return;
        }
        resolveClose();
      });
    });
  }
}
