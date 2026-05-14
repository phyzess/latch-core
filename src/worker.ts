import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { DEFAULT_SERVICE_CONFIG_YAML } from "./lib/default-service-config";
import {
  ConfigValidationError,
  parseServiceConfigSource,
  type ServiceEntry
} from "./lib/service-config";
import { resolveServiceEntries } from "./lib/service-metadata";

const SERVICES_CURRENT_KEY = "services.current";
const SERVICES_RAW_KEY = "services.raw";
const SERVICES_REVISIONS_KEY = "services.revisions";
const SERVICE_REVISION_PREFIX = "services.revision.";
const MAX_REVISIONS = 20;

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8"
};

const TEXT_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "text/plain; charset=utf-8"
};

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export interface Env {
  ASSETS: Fetcher;
  LATCH_CONFIG: KVNamespace;
  POLICY_AUD?: string;
  TEAM_DOMAIN?: string;
  LATCH_ADMIN_EMAILS?: string;
}

export type AuthSession = {
  email: string;
  isAdmin: boolean;
  isLocal: boolean;
};

export type ServiceRevisionSummary = {
  id: string;
  savedAt: string;
  savedBy: string;
  serviceCount: number;
};

type ServiceRevisionSnapshot = ServiceRevisionSummary & {
  raw: string;
  services: ServiceEntry[];
};

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env, ctx);
  }
};

export async function handleRequest(
  request: Request,
  env: Env,
  _ctx?: ExecutionContext,
  sessionOverride?: AuthSession
): Promise<Response> {
  const session = sessionOverride ?? (await authenticateRequest(request, env));
  if (session instanceof Response) {
    return session;
  }

  const url = new URL(request.url);

  if (url.pathname === "/services.json") {
    return handleServicesJson(request, env);
  }

  if (url.pathname === "/api/session") {
    return handleSession(request, env, session);
  }

  if (url.pathname === "/api/config") {
    if (!session.isAdmin) {
      return jsonError("Admin access required.", 403);
    }

    if (request.method === "GET") {
      return handleGetConfig(env);
    }

    if (request.method === "PUT") {
      return handlePutConfig(request, env, session);
    }

    return jsonError("Method not allowed.", 405);
  }

  if (url.pathname === "/api/rollback") {
    if (!session.isAdmin) {
      return jsonError("Admin access required.", 403);
    }

    if (request.method === "POST") {
      return handleRollback(request, env, session);
    }

    return jsonError("Method not allowed.", 405);
  }

  if (url.pathname.startsWith("/api/")) {
    return jsonError("Not found.", 404);
  }

  return env.ASSETS.fetch(request);
}

export async function authenticateRequest(
  request: Request,
  env: Env
): Promise<AuthSession | Response> {
  if (isLocalRequest(request)) {
    return {
      email: "dev@localhost",
      isAdmin: true,
      isLocal: true
    };
  }

  if (!env.POLICY_AUD || !env.TEAM_DOMAIN) {
    return new Response(
      "Cloudflare Access must be configured in production. Set POLICY_AUD and TEAM_DOMAIN.",
      {
        headers: TEXT_HEADERS,
        status: 500
      }
    );
  }

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) {
    return new Response("Missing required CF Access JWT.", {
      headers: TEXT_HEADERS,
      status: 403
    });
  }

  let payload: JWTPayload;
  try {
    const { issuer, certsUrl } = getAccessUrls(env.TEAM_DOMAIN);
    const jwks = getJwks(certsUrl);
    const verified = await jwtVerify(token, jwks, {
      audience: env.POLICY_AUD,
      issuer
    });
    payload = verified.payload;
  } catch {
    return new Response("Invalid or expired Access token.", {
      headers: TEXT_HEADERS,
      status: 403
    });
  }

  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
  return {
    email,
    isAdmin: isAdminEmail(email, env.LATCH_ADMIN_EMAILS),
    isLocal: false
  };
}

export function getAccessUrls(teamDomain: string): { issuer: string; certsUrl: URL } {
  const certsPath = "/cdn-cgi/access/certs";
  const teamUrl = new URL(teamDomain);
  const issuer = teamUrl.origin;
  const certsUrl = teamUrl.pathname.endsWith(certsPath) ? teamUrl : new URL(certsPath, issuer);

  return { issuer, certsUrl };
}

export function parseAdminEmails(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string, adminEmails: string | undefined): boolean {
  if (!email) {
    return false;
  }

  return parseAdminEmails(adminEmails).has(email.toLowerCase());
}

async function handleServicesJson(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonError("Method not allowed.", 405);
  }

  const services = await getCurrentServices(env);
  return json(services);
}

async function handleSession(request: Request, env: Env, session: AuthSession): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonError("Method not allowed.", 405);
  }

  return json({
    configured: await isConfigured(env),
    email: session.email,
    isAdmin: session.isAdmin
  });
}

async function handleGetConfig(env: Env): Promise<Response> {
  const [configured, raw, services, revisions] = await Promise.all([
    isConfigured(env),
    getRawConfig(env),
    getCurrentServices(env),
    getRevisionSummaries(env)
  ]);

  return json({
    configured,
    raw: raw ?? DEFAULT_SERVICE_CONFIG_YAML,
    revisions,
    services
  });
}

async function handlePutConfig(
  request: Request,
  env: Env,
  session: AuthSession
): Promise<Response> {
  const body = await readJson(request);
  if (body instanceof Response) {
    return body;
  }

  const raw = getRawFromBody(body);
  if (raw instanceof Response) {
    return raw;
  }

  try {
    const saved = await persistConfig(env, raw, session.email);
    return json({
      configured: true,
      raw,
      revisions: saved.revisions,
      services: saved.services
    });
  } catch (error) {
    return configErrorResponse(error);
  }
}

async function handleRollback(request: Request, env: Env, session: AuthSession): Promise<Response> {
  const body = await readJson(request);
  if (body instanceof Response) {
    return body;
  }

  const revisionId = getRevisionIdFromBody(body);
  if (revisionId instanceof Response) {
    return revisionId;
  }

  const revision = await getRevision(env, revisionId);
  if (!revision) {
    return jsonError("Revision not found.", 404);
  }

  const saved = await persistConfig(env, revision.raw, session.email);
  return json({
    configured: true,
    raw: revision.raw,
    revisions: saved.revisions,
    services: saved.services
  });
}

async function persistConfig(
  env: Env,
  raw: string,
  savedBy: string
): Promise<{ revisions: ServiceRevisionSummary[]; services: ServiceEntry[] }> {
  const services = parseServiceConfigSource(raw, {
    mode: "private"
  });
  const resolvedServices = await resolveServiceEntries(services);
  const savedAt = new Date().toISOString();
  const id = `${Date.now()}-${crypto.randomUUID()}`;
  const summary: ServiceRevisionSummary = {
    id,
    savedAt,
    savedBy,
    serviceCount: resolvedServices.length
  };
  const snapshot: ServiceRevisionSnapshot = {
    ...summary,
    raw,
    services: resolvedServices
  };

  const previousRevisions = await getRevisionSummaries(env);
  const nextRevisions = [summary, ...previousRevisions].slice(0, MAX_REVISIONS);
  const prunedRevisions = previousRevisions.slice(MAX_REVISIONS - 1);

  await env.LATCH_CONFIG.put(`${SERVICE_REVISION_PREFIX}${id}`, JSON.stringify(snapshot));
  await env.LATCH_CONFIG.put(SERVICES_CURRENT_KEY, JSON.stringify(resolvedServices));
  await env.LATCH_CONFIG.put(SERVICES_RAW_KEY, raw);
  await env.LATCH_CONFIG.put(SERVICES_REVISIONS_KEY, JSON.stringify(nextRevisions));
  await Promise.all(
    prunedRevisions.map((revision) =>
      env.LATCH_CONFIG.delete(`${SERVICE_REVISION_PREFIX}${revision.id}`)
    )
  );

  return {
    revisions: nextRevisions,
    services: resolvedServices
  };
}

async function getCurrentServices(env: Env): Promise<ServiceEntry[]> {
  const services = await env.LATCH_CONFIG.get<ServiceEntry[]>(SERVICES_CURRENT_KEY, "json");
  return Array.isArray(services) ? services : [];
}

async function getRawConfig(env: Env): Promise<string | null> {
  return env.LATCH_CONFIG.get(SERVICES_RAW_KEY);
}

async function isConfigured(env: Env): Promise<boolean> {
  return (await env.LATCH_CONFIG.get(SERVICES_CURRENT_KEY)) !== null;
}

async function getRevisionSummaries(env: Env): Promise<ServiceRevisionSummary[]> {
  const revisions = await env.LATCH_CONFIG.get<ServiceRevisionSummary[]>(
    SERVICES_REVISIONS_KEY,
    "json"
  );
  if (!Array.isArray(revisions)) {
    return [];
  }

  return revisions.filter(isRevisionSummary);
}

async function getRevision(env: Env, revisionId: string): Promise<ServiceRevisionSnapshot | null> {
  const revision = await env.LATCH_CONFIG.get<ServiceRevisionSnapshot>(
    `${SERVICE_REVISION_PREFIX}${revisionId}`,
    "json"
  );
  return isRevisionSnapshot(revision) ? revision : null;
}

function getJwks(certsUrl: URL): ReturnType<typeof createRemoteJWKSet> {
  const cacheKey = certsUrl.toString();
  const cached = jwksCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const jwks = createRemoteJWKSet(certsUrl);
  jwksCache.set(cacheKey, jwks);
  return jwks;
}

function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

async function readJson(request: Request): Promise<unknown | Response> {
  try {
    return await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }
}

function getRawFromBody(body: unknown): string | Response {
  if (!body || typeof body !== "object" || typeof (body as { raw?: unknown }).raw !== "string") {
    return jsonError('Request body must include a string "raw" field.', 400);
  }

  return (body as { raw: string }).raw;
}

function getRevisionIdFromBody(body: unknown): string | Response {
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { revisionId?: unknown }).revisionId !== "string"
  ) {
    return jsonError('Request body must include a string "revisionId" field.', 400);
  }

  return (body as { revisionId: string }).revisionId;
}

function configErrorResponse(error: unknown): Response {
  if (error instanceof ConfigValidationError) {
    return jsonError(error.message, 400, error.details);
  }

  throw error;
}

function isRevisionSummary(value: unknown): value is ServiceRevisionSummary {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as ServiceRevisionSummary).id === "string" &&
    typeof (value as ServiceRevisionSummary).savedAt === "string" &&
    typeof (value as ServiceRevisionSummary).savedBy === "string" &&
    typeof (value as ServiceRevisionSummary).serviceCount === "number"
  );
}

function isRevisionSnapshot(value: unknown): value is ServiceRevisionSnapshot {
  const snapshot = value as Partial<ServiceRevisionSnapshot>;
  return (
    isRevisionSummary(value) && typeof snapshot.raw === "string" && Array.isArray(snapshot.services)
  );
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    headers: JSON_HEADERS,
    status
  });
}

function jsonError(message: string, status: number, details: string[] = []): Response {
  return json(
    {
      error: {
        details,
        message
      }
    },
    status
  );
}
