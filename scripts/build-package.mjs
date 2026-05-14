import { chmod, cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const packageDir = resolve(root, "package");

await rm(packageDir, { force: true, recursive: true });
await mkdir(packageDir, { recursive: true });

await cp(resolve(root, "dist"), resolve(packageDir, "static"), {
  recursive: true
});
await rm(resolve(packageDir, "static/services.json"), { force: true });

const sharedBuildOptions = {
  bundle: true,
  format: "esm",
  legalComments: "none",
  sourcemap: false,
  target: "es2022"
};

await build({
  ...sharedBuildOptions,
  entryPoints: [resolve(root, "src/worker.ts")],
  outfile: resolve(packageDir, "worker.js"),
  platform: "neutral"
});

await build({
  ...sharedBuildOptions,
  entryPoints: [resolve(root, "src/public-config.ts")],
  outfile: resolve(packageDir, "config.js"),
  platform: "neutral"
});

await build({
  ...sharedBuildOptions,
  banner: {
    js: "#!/usr/bin/env node"
  },
  entryPoints: [resolve(root, "src/cli.ts")],
  outfile: resolve(packageDir, "cli.js"),
  platform: "node",
  target: "node26"
});

await chmod(resolve(packageDir, "cli.js"), 0o755);
