# @phyzess/latch

Core package for Latch, a private launch surface for self-hosted web services.

This package contains the built Latch UI, the Cloudflare Worker runtime, and the small CLI used by the thin deployment template at [phyzess/latch](https://github.com/phyzess/latch).

## Public API

```ts
export { default } from "@phyzess/latch/worker";
export type { Env } from "@phyzess/latch/worker";
```

```ts
import {
  ConfigValidationError,
  parseServiceConfigSource,
  validateServiceConfig,
  type ServiceEntry
} from "@phyzess/latch/config";
```

## CLI

```sh
latch build --out dist
latch doctor
```

`latch build` copies the packaged static assets into a deployment repo and deliberately removes any static `services.json`; production links are loaded from Workers KV at runtime.

When production config is saved, the Worker resolves missing service names from linked page titles and missing icons from linked page favicons. Manually configured `name` and `icon` values take priority.

## Development

```sh
pnpm dev
```

`pnpm dev` builds the static UI and starts Wrangler with the same Worker, assets, API routes, `/settings`, `/services.json`, and local KV flow used by a deployed site. Localhost skips Cloudflare Access and treats `dev@localhost` as an admin.

Use `pnpm dev:ui` only for isolated Astro UI work that does not need Worker APIs.

## Release

Use [docs/release.md](docs/release.md) as the release checklist. Short version:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm pack:check
npm publish --access public
```

After publishing a new version, update deployment instances by bumping their
`@phyzess/latch` dependency. Update the deployment template only when its
wrapper files need to change.

## Security

Production deployments must be protected by Cloudflare Access. The Worker validates Access JWTs and fails closed when `POLICY_AUD` or `TEAM_DOMAIN` are missing.

Latch stores links in Workers KV and never stores service passwords, tokens, cookies, or credentials.
