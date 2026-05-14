import * as v from "valibot";
import { parse as parseYaml } from "yaml";

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const shortcutPattern = /^[a-z0-9]$/i;
const secretKeyPattern =
  /\b(password|passwd|token|secret|api[_-]?key|cookie|session|private[_-]?key)\b/i;
const tokenLikePattern = /\b[A-Za-z0-9_-]{32,}\b/;

const nonEmptyString = v.pipe(v.string(), v.trim(), v.minLength(1));

export const serviceEntrySchema = v.strictObject({
  id: v.pipe(nonEmptyString, v.regex(kebabCasePattern, "Use lowercase kebab-case.")),
  name: v.optional(nonEmptyString),
  url: v.pipe(v.string(), v.url(), v.startsWith("https://", "Service URLs must use HTTPS.")),
  icon: v.optional(v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/i, "Use a simple icon name."))),
  aliases: v.optional(v.array(nonEmptyString)),
  group: v.optional(nonEmptyString),
  shortcut: v.optional(
    v.pipe(v.string(), v.regex(shortcutPattern, "Shortcuts must be one letter or digit."))
  ),
  pinned: v.optional(v.boolean()),
  tags: v.optional(v.array(nonEmptyString))
});

const configSchema = v.strictObject({
  services: v.pipe(v.array(serviceEntrySchema), v.minLength(1))
});

export type ServiceConfigEntry = v.InferOutput<typeof serviceEntrySchema>;

export type ServiceEntry = Omit<ServiceConfigEntry, "name"> & {
  name: string;
  iconUrl?: string;
};

export type ValidationMode = "private" | "example";

export class ConfigValidationError extends Error {
  readonly details: string[];

  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = "ConfigValidationError";
    this.details = details;
  }
}

export function parseServiceConfigSource(
  rawSource: string,
  options: {
    mode: ValidationMode;
    sourceLabel?: string;
  }
): ServiceConfigEntry[] {
  let parsed: unknown;

  try {
    parsed = parseYaml(rawSource);
  } catch (error) {
    throw new ConfigValidationError(
      `Could not parse service config${options.sourceLabel ? ` in ${options.sourceLabel}` : ""}.`,
      [error instanceof Error ? error.message : "Invalid YAML."]
    );
  }

  const validationOptions: {
    mode: ValidationMode;
    rawSource: string;
    sourceLabel?: string;
  } = {
    mode: options.mode,
    rawSource
  };
  if (options.sourceLabel) {
    validationOptions.sourceLabel = options.sourceLabel;
  }

  return validateServiceConfig(parsed, validationOptions);
}

export function validateServiceConfig(
  input: unknown,
  options: {
    mode: ValidationMode;
    rawSource?: string;
    sourceLabel?: string;
  }
): ServiceConfigEntry[] {
  assertNoObviousSecrets(options.rawSource ?? "");

  const result = v.safeParse(configSchema, input);
  if (!result.success) {
    throw new ConfigValidationError(
      `Invalid service config${options.sourceLabel ? ` in ${options.sourceLabel}` : ""}.`,
      formatValibotIssues(result.issues)
    );
  }

  const services = result.output.services;
  assertUniqueIds(services);
  assertUniqueShortcuts(services);
  assertSafeUrls(services);

  if (options.mode === "example") {
    assertExampleDomains(services);
  }

  return services;
}

export function serializeServices(services: ServiceConfigEntry[]): string {
  return `${JSON.stringify(services, null, 2)}\n`;
}

function assertNoObviousSecrets(rawSource: string): void {
  if (secretKeyPattern.test(rawSource)) {
    throw new ConfigValidationError("Service config appears to contain a secret field name.");
  }

  if (tokenLikePattern.test(rawSource)) {
    throw new ConfigValidationError("Service config appears to contain a token-like value.");
  }
}

function assertUniqueIds(services: ServiceConfigEntry[]): void {
  const seen = new Map<string, string>();

  for (const service of services) {
    const label = getServiceLabel(service);
    const previous = seen.get(service.id);
    if (previous) {
      throw new ConfigValidationError(`Duplicate service id "${service.id}".`, [
        `${previous} and ${label} share the same id.`
      ]);
    }

    seen.set(service.id, label);
  }
}

function assertUniqueShortcuts(services: ServiceConfigEntry[]): void {
  const seen = new Map<string, string>();

  for (const service of services) {
    if (!service.shortcut) {
      continue;
    }

    const shortcut = service.shortcut.toLowerCase();
    const label = getServiceLabel(service);
    const previous = seen.get(shortcut);
    if (previous) {
      throw new ConfigValidationError(`Shortcut "${service.shortcut}" is used more than once.`, [
        `${previous} and ${label} share the same shortcut.`
      ]);
    }

    seen.set(shortcut, label);
  }
}

function assertSafeUrls(services: ServiceConfigEntry[]): void {
  for (const service of services) {
    const url = new URL(service.url);
    const hostname = normalizeHostname(url.hostname);

    if (isPrivateHostname(hostname)) {
      throw new ConfigValidationError(`Service "${service.id}" uses a private or local host.`, [
        service.url
      ]);
    }
  }
}

function assertExampleDomains(services: ServiceConfigEntry[]): void {
  for (const service of services) {
    const hostname = normalizeHostname(new URL(service.url).hostname);
    if (hostname !== "example.com" && !hostname.endsWith(".example.com")) {
      throw new ConfigValidationError(
        `Example service "${service.id}" must use an example.com hostname.`,
        [service.url]
      );
    }
  }
}

function getServiceLabel(service: ServiceConfigEntry): string {
  return service.name ?? service.id;
}

function isPrivateHostname(hostname: string): boolean {
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    return true;
  }

  const ipv4 = parseIpv4(hostname);
  if (ipv4) {
    const [first, second] = ipv4;
    return (
      first === 10 ||
      first === 127 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 169 && second === 254)
    );
  }

  return isPrivateIpv6(hostname);
}

function parseIpv4(hostname: string): [number, number, number, number] | undefined {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    return undefined;
  }

  const octets = hostname.split(".").map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return undefined;
  }

  return octets as [number, number, number, number];
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "");
}

function formatValibotIssues(issues: v.BaseIssue<unknown>[]): string[] {
  return issues.map((issue) => {
    const path =
      issue.path
        ?.map((item) => ("key" in item ? String(item.key) : ""))
        .filter(Boolean)
        .join(".") || "root";

    return `${path}: ${issue.message}`;
  });
}
