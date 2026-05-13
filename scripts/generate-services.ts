import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  ConfigValidationError,
  parseServiceConfigSource,
  serializeServices,
  type ValidationMode
} from "./service-config.ts";

const args = new Set(process.argv.slice(2));

const isExample = args.has("--example");
const isCheck = args.has("--check");
const explicitInput = getArgValue("--input");
const explicitOutput = getArgValue("--out");

const mode: ValidationMode = isExample ? "example" : "private";

try {
  const inputFile = resolveInputFile();
  const outputFile = resolve(process.cwd(), explicitOutput ?? "public/services.json");
  const rawSource = await readFile(inputFile, "utf8");
  const services = parseServiceConfigSource(rawSource, {
    mode,
    sourceLabel: inputFile
  });

  if (!isCheck) {
    await mkdir(dirname(outputFile), { recursive: true });
    await writeFile(outputFile, serializeServices(services), "utf8");
  }

  const action = isCheck ? "Validated" : "Generated";
  console.log(`${action} ${services.length} services from ${inputFile}.`);
} catch (error) {
  if (error instanceof ConfigValidationError) {
    console.error(error.message);
    for (const detail of error.details) {
      console.error(`- ${detail}`);
    }
    process.exit(1);
  }

  throw error;
}

function resolveInputFile(): string {
  if (isExample) {
    return resolve(process.cwd(), "config/services.example.yaml");
  }

  const configuredInput = explicitInput ?? process.env.LATCH_SERVICES_FILE;
  if (!configuredInput) {
    throw new ConfigValidationError(
      "Missing service config. Set LATCH_SERVICES_FILE=/absolute/path/to/services.local.yaml or pass --input."
    );
  }

  return resolve(process.cwd(), configuredInput);
}

function getArgValue(name: string): string | undefined {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found?.slice(prefix.length);
}
