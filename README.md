# Latch

Latch is a private launch surface for self-hosted web services. It is built with Astro, vanilla Web Components, Cloudflare Workers Static Assets, and Workers KV for runtime service configuration.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/phyzess/latch)

## Stack

- Astro `6.3.1`
- TypeScript `6.0.3`
- Vanilla Custom Elements with open Shadow DOM
- Valibot for service config validation
- Cloudflare Workers Static Assets
- Cloudflare Workers KV for service configuration
- Cloudflare Access JWT validation for production auth
- mise for local toolchain management

## Quick Start

```sh
mise install
pnpm install --frozen-lockfile
pnpm dev
```

The development server uses `config/services.example.yaml`.

For Worker-backed local development:

```sh
cp .dev.vars.example .dev.vars
pnpm dev:worker
```

`localhost` skips Cloudflare Access and treats `dev@localhost` as an admin.

## Runtime Config

Production service lists live in the `LATCH_CONFIG` Workers KV namespace. Visit `/settings` after deployment to edit the YAML config.

The YAML shape is:

```yaml
services:
  - id: photos
    name: Photos
    url: https://photos.example.com
    icon: image
    shortcut: "1"
```

Real service lists must not be committed. For local validation of an ignored YAML file:

```sh
LATCH_SERVICES_FILE=config/services.local.yaml pnpm validate:services:input
```

`pnpm generate:services:example` remains available for static UI development only.

## Security Boundary

Your service list is sensitive. Production deployments must place Cloudflare Access in front of the whole Latch domain. The Worker also validates the Cloudflare Access JWT in production and fails closed if `POLICY_AUD` or `TEAM_DOMAIN` are missing.

Only emails listed in `LATCH_ADMIN_EMAILS` can edit links in `/settings`.

Latch never stores service passwords, tokens, cookies, or credentials.

## Useful Commands

```sh
pnpm validate:services
LATCH_SERVICES_FILE=config/services.local.yaml pnpm validate:services:input
pnpm check
pnpm test
pnpm build
pnpm deploy:dry
```

## License

MIT
