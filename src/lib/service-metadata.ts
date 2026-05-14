import type { ServiceConfigEntry, ServiceEntry } from "./service-config";

const METADATA_FETCH_TIMEOUT_MS = 3000;
const HTML_METADATA_LIMIT = 128_000;

type ServiceMetadata = {
  title?: string;
  iconUrl?: string;
};

export async function resolveServiceEntries(
  services: ServiceConfigEntry[]
): Promise<ServiceEntry[]> {
  const metadata = await Promise.all(services.map((service) => fetchServiceMetadata(service)));

  return services.map((service, index) => applyServiceMetadata(service, metadata[index] ?? {}));
}

function applyServiceMetadata(
  service: ServiceConfigEntry,
  metadata: ServiceMetadata
): ServiceEntry {
  const resolved: ServiceEntry = {
    ...service,
    name: service.name ?? metadata.title ?? new URL(service.url).hostname
  };

  if (!service.icon && metadata.iconUrl) {
    resolved.iconUrl = metadata.iconUrl;
  }

  return resolved;
}

async function fetchServiceMetadata(service: ServiceConfigEntry): Promise<ServiceMetadata> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), METADATA_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(service.url, {
      headers: {
        Accept: "text/html,application/xhtml+xml"
      },
      redirect: "follow",
      signal: controller.signal
    });

    if (!response.ok || !isHtmlResponse(response)) {
      return {};
    }

    const html = (await response.text()).slice(0, HTML_METADATA_LIMIT);
    const baseUrl = getMetadataBaseUrl(response, service.url);
    const title = extractTitle(html);
    const iconUrl = extractIconUrl(html, baseUrl);
    const metadata: ServiceMetadata = {};

    if (title) {
      metadata.title = title;
    }

    if (iconUrl) {
      metadata.iconUrl = iconUrl;
    }

    return metadata;
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

function isHtmlResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type")?.toLowerCase();
  return (
    !contentType ||
    contentType.includes("text/html") ||
    contentType.includes("application/xhtml+xml")
  );
}

function getMetadataBaseUrl(response: Response, fallbackUrl: string): URL {
  if (response.url) {
    const responseUrl = new URL(response.url);
    if (responseUrl.protocol === "https:") {
      return responseUrl;
    }
  }

  return new URL(fallbackUrl);
}

function extractTitle(html: string): string | undefined {
  const title = cleanHtmlText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  if (title) {
    return title;
  }

  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(tag[0]);
    const name = attributes.get("property") ?? attributes.get("name") ?? "";
    if (!["og:title", "twitter:title", "title"].includes(name.toLowerCase())) {
      continue;
    }

    const content = cleanHtmlText(attributes.get("content") ?? "");
    if (content) {
      return content;
    }
  }

  return undefined;
}

function extractIconUrl(html: string, baseUrl: URL): string | undefined {
  const candidates: Array<{ score: number; url: string }> = [];

  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = parseAttributes(tag[0]);
    const rel = attributes.get("rel")?.toLowerCase() ?? "";
    const href = attributes.get("href");
    if (!href || !isIconRel(rel)) {
      continue;
    }

    const url = resolveHttpsUrl(href, baseUrl);
    if (!url) {
      continue;
    }

    candidates.push({
      score: rel.includes("apple-touch-icon") ? 2 : 1,
      url
    });
  }

  candidates.sort((left, right) => right.score - left.score);
  return candidates[0]?.url ?? resolveHttpsUrl("/favicon.ico", baseUrl);
}

function isIconRel(rel: string): boolean {
  const tokens = rel.split(/\s+/).filter(Boolean);
  return tokens.includes("icon") || tokens.some((token) => token.startsWith("apple-touch-icon"));
}

function resolveHttpsUrl(value: string, baseUrl: URL): string | undefined {
  try {
    const url = new URL(value, baseUrl);
    if (url.protocol !== "https:" || isPrivateHostname(normalizeHostname(url.hostname))) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

function parseAttributes(tag: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const attributePattern = /([^\s"'=<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of tag.matchAll(attributePattern)) {
    const name = match[1]?.toLowerCase();
    if (!name) {
      continue;
    }

    attributes.set(name, decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? ""));
  }

  return attributes;
}

function cleanHtmlText(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"'
  };

  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith("#x")) {
      return decodeCodePoint(match, Number.parseInt(lower.slice(2), 16));
    }

    if (lower.startsWith("#")) {
      return decodeCodePoint(match, Number.parseInt(lower.slice(1), 10));
    }

    return namedEntities[lower] ?? match;
  });
}

function decodeCodePoint(fallback: string, codePoint: number): string {
  try {
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : fallback;
  } catch {
    return fallback;
  }
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
