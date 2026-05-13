import { describe, expect, it } from "vitest";
import {
  getAccessUrls,
  handleRequest,
  parseAdminEmails,
  type AuthSession,
  type Env
} from "../src/worker";

const validRaw = `services:
  - id: photos
    name: Photos
    url: https://photos.example.com
    shortcut: "1"
`;

const otherRaw = `services:
  - id: notes
    name: Notes
    url: https://notes.example.com
    shortcut: "2"
`;

const adminSession: AuthSession = {
  email: "admin@example.com",
  isAdmin: true,
  isLocal: false
};

const userSession: AuthSession = {
  email: "user@example.com",
  isAdmin: false,
  isLocal: false
};

describe("worker auth helpers", () => {
  it("parses admin email allowlists case-insensitively", () => {
    expect([...parseAdminEmails(" Alice@Example.com, bob@example.com ,, ")]).toEqual([
      "alice@example.com",
      "bob@example.com"
    ]);
  });

  it("normalizes Cloudflare Access cert URLs", () => {
    expect(getAccessUrls("https://team.cloudflareaccess.com").certsUrl.toString()).toBe(
      "https://team.cloudflareaccess.com/cdn-cgi/access/certs"
    );
    expect(
      getAccessUrls("https://team.cloudflareaccess.com/cdn-cgi/access/certs").certsUrl.toString()
    ).toBe("https://team.cloudflareaccess.com/cdn-cgi/access/certs");
  });
});

describe("worker config API", () => {
  it("returns an empty service list before setup", async () => {
    const env = makeEnv();
    const response = await handleRequest(new Request("http://localhost/services.json"), env);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects config writes from non-admin users", async () => {
    const env = makeEnv();
    const response = await handleRequest(
      new Request("https://latch.example.com/api/config", {
        body: JSON.stringify({ raw: validRaw }),
        method: "PUT"
      }),
      env,
      undefined,
      userSession
    );

    expect(response.status).toBe(403);
  });

  it("saves valid YAML and serves normalized services", async () => {
    const env = makeEnv();
    const saveResponse = await saveConfig(env, validRaw);
    expect(saveResponse.status).toBe(200);

    const servicesResponse = await handleRequest(
      new Request("https://latch.example.com/services.json"),
      env,
      undefined,
      userSession
    );
    const services = (await servicesResponse.json()) as Array<{ id: string }>;

    expect(services).toEqual([
      {
        id: "photos",
        name: "Photos",
        shortcut: "1",
        url: "https://photos.example.com"
      }
    ]);
  });

  it("does not overwrite existing config when YAML is invalid", async () => {
    const env = makeEnv();
    await saveConfig(env, validRaw);

    const invalidResponse = await saveConfig(env, "services:\n  - id: router\n    token: nope\n");
    expect(invalidResponse.status).toBe(400);

    const servicesResponse = await handleRequest(
      new Request("https://latch.example.com/services.json"),
      env,
      undefined,
      userSession
    );
    const services = (await servicesResponse.json()) as Array<{ id: string }>;

    expect(services[0]?.id).toBe("photos");
  });

  it("restores a previous revision", async () => {
    const env = makeEnv();
    const firstSave = await saveConfig(env, validRaw);
    const firstPayload = (await firstSave.json()) as {
      revisions: Array<{ id: string }>;
    };
    await saveConfig(env, otherRaw);

    const rollbackResponse = await handleRequest(
      new Request("https://latch.example.com/api/rollback", {
        body: JSON.stringify({ revisionId: firstPayload.revisions[0]?.id }),
        method: "POST"
      }),
      env,
      undefined,
      adminSession
    );
    const rollbackPayload = (await rollbackResponse.json()) as {
      services: Array<{ id: string }>;
    };

    expect(rollbackResponse.status).toBe(200);
    expect(rollbackPayload.services[0]?.id).toBe("photos");
  });
});

async function saveConfig(env: Env, raw: string): Promise<Response> {
  return handleRequest(
    new Request("https://latch.example.com/api/config", {
      body: JSON.stringify({ raw }),
      method: "PUT"
    }),
    env,
    undefined,
    adminSession
  );
}

function makeEnv(): Env {
  return {
    ASSETS: {
      fetch: () => Promise.resolve(new Response("asset"))
    } as unknown as Fetcher,
    LATCH_ADMIN_EMAILS: "admin@example.com",
    LATCH_CONFIG: new MemoryKV() as unknown as KVNamespace,
    POLICY_AUD: "aud",
    TEAM_DOMAIN: "https://team.cloudflareaccess.com"
  };
}

class MemoryKV {
  #store = new Map<string, string>();

  async get<T = string>(key: string, type?: string): Promise<T | string | null> {
    const value = this.#store.get(key);
    if (value === undefined) {
      return null;
    }

    if (type === "json") {
      return JSON.parse(value) as T;
    }

    return value;
  }

  async put(key: string, value: string): Promise<void> {
    this.#store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.#store.delete(key);
  }
}
