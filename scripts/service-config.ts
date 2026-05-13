import { isIP } from "node:net";
import * as v from "valibot";

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const shortcutPattern = /^[a-z0-9]$/i;
const secretKeyPattern =
  /\b(password|passwd|token|secret|api[_-]?key|cookie|session|private[_-]?key)\b/i;
const tokenLikePattern = /\b[A-Za-z0-9_-]{32,}\b/;

const nonEmptyString = v.pipe(v.string(), v.trim(), v.minLength(1));

export const serviceEntrySchema = v.strictObject({
  id: v.pipe(nonEmptyString, v.regex(kebabCasePattern, "Use lowercase kebab-case.")),
  name: nonEmptyString,
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

export type ServiceEntry = v.InferOutput<typeof serviceEntrySchema>;

export type ValidationMode = "private" | "example";

export class ConfigValidationError extends Error {
  readonly details: string[];

  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = "ConfigValidationError";
    this.details = details;
  }
}

export function validateServiceConfig(
  input: unknown,
  options: {
    mode: ValidationMode;
    rawSource?: string;
    sourceLabel?: string;
  }
): ServiceEntry[] {
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

export function serializeServices(services: ServiceEntry[]): string {
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

function assertUniqueIds(services: ServiceEntry[]): void {
  const seen = new Map<string, string>();

  for (const service of services) {
    const previous = seen.get(service.id);
    if (previous) {
      throw new ConfigValidationError(`Duplicate service id "${service.id}".`, [
        `${previous} and ${service.name} share the same id.`
      ]);
    }

    seen.set(service.id, service.name);
  }
}

function assertUniqueShortcuts(services: ServiceEntry[]): void {
  const seen = new Map<string, string>();

  for (const service of services) {
    if (!service.shortcut) {
      continue;
    }

    const shortcut = service.shortcut.toLowerCase();
    const previous = seen.get(shortcut);
    if (previous) {
      throw new ConfigValidationError(`Shortcut "${service.shortcut}" is used more than once.`, [
        `${previous} and ${service.name} share the same shortcut.`
      ]);
    }

    seen.set(shortcut, service.name);
  }
}

function assertSafeUrls(services: ServiceEntry[]): void {
  for (const service of services) {
    const url = new URL(service.url);
    const hostname = url.hostname.toLowerCase();

    if (isPrivateHostname(hostname)) {
      throw new ConfigValidationError(`Service "${service.id}" uses a private or local host.`, [
        service.url
      ]);
    }
  }
}

function assertExampleDomains(services: ServiceEntry[]): void {
  for (const service of services) {
    const hostname = new URL(service.url).hostname.toLowerCase();
    if (hostname !== "example.com" && !hostname.endsWith(".example.com")) {
      throw new ConfigValidationError(
        `Example service "${service.id}" must use an example.com hostname.`,
        [service.url]
      );
    }
  }
}

function isPrivateHostname(hostname: string): boolean {
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    return true;
  }

  const ipVersion = isIP(hostname);
  if (ipVersion === 0) {
    return false;
  }

  if (ipVersion === 6) {
    return (
      hostname === "::1" ||
      hostname.startsWith("fc") ||
      hostname.startsWith("fd") ||
      hostname.startsWith("fe80:")
    );
  }

  const octets = hostname.split(".").map((part) => Number(part));
  const [first, second] = octets;

  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second !== undefined && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
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
