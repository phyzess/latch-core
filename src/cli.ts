import { access, cp, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type CommandResult = {
  code: number;
  message?: string;
};

const packageDir = dirname(fileURLToPath(import.meta.url));
const staticDir = resolve(packageDir, "static");

async function main(argv: string[]): Promise<CommandResult> {
  const [command, ...args] = argv;

  if (command === "build") {
    return buildStaticAssets(args);
  }

  if (command === "doctor") {
    return doctor();
  }

  return {
    code: command === "--help" || command === "-h" ? 0 : 1,
    message: ["Usage:", "  latch build --out <dir>", "  latch doctor"].join("\n")
  };
}

async function buildStaticAssets(args: string[]): Promise<CommandResult> {
  const out = readOption(args, "--out") ?? readOption(args, "-o");

  if (!out) {
    return {
      code: 1,
      message: "Missing required --out <dir> option."
    };
  }

  const outputDir = resolve(process.cwd(), out);
  await rm(outputDir, { force: true, recursive: true });
  await mkdir(outputDir, { recursive: true });
  await cp(staticDir, outputDir, { recursive: true });
  await rm(resolve(outputDir, "services.json"), { force: true });

  return {
    code: 0,
    message: `Latch static assets written to ${outputDir}`
  };
}

async function doctor(): Promise<CommandResult> {
  const checks = await Promise.all([
    checkFile("wrangler.jsonc"),
    checkFile("worker.ts"),
    checkFile("package.json")
  ]);

  const missing = checks.filter((check) => !check.ok).map((check) => check.path);
  if (missing.length > 0) {
    return {
      code: 1,
      message: `Missing expected template file(s): ${missing.join(", ")}`
    };
  }

  const [wrangler, worker, manifest] = await Promise.all([
    readFile(resolve(process.cwd(), "wrangler.jsonc"), "utf8"),
    readFile(resolve(process.cwd(), "worker.ts"), "utf8"),
    readFile(resolve(process.cwd(), "package.json"), "utf8")
  ]);

  const failures = [
    ['wrangler.jsonc must bind "ASSETS"', wrangler.includes('"binding": "ASSETS"')],
    ['wrangler.jsonc must bind "LATCH_CONFIG"', wrangler.includes('"binding": "LATCH_CONFIG"')],
    ['wrangler.jsonc must use "./dist" assets', wrangler.includes('"directory": "./dist"')],
    ['worker.ts must re-export "@phyzess/latch/worker"', worker.includes("@phyzess/latch/worker")],
    ['package.json must depend on "@phyzess/latch"', manifest.includes('"@phyzess/latch"')]
  ].filter(([, passed]) => !passed);

  if (failures.length > 0) {
    return {
      code: 1,
      message: failures.map(([message]) => `- ${message}`).join("\n")
    };
  }

  return {
    code: 0,
    message: "Latch template checks passed."
  };
}

function readOption(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

async function checkFile(path: string): Promise<{ ok: boolean; path: string }> {
  try {
    await access(resolve(process.cwd(), path));
    return { ok: true, path };
  } catch {
    return { ok: false, path };
  }
}

const result = await main(process.argv.slice(2));
if (result.message) {
  const write = result.code === 0 ? console.log : console.error;
  write(result.message);
}
process.exitCode = result.code;
