# Latch

Latch is a private launch surface for self-hosted web services. It is built with Astro, vanilla Web Components, Cloudflare Workers Static Assets, and Workers KV for runtime service configuration.

## How to Deploy

Important: clicking the Deploy to Cloudflare button is only the first step. Latch intentionally fails closed in production until Cloudflare Access is enabled and the Access values are configured on the Worker.

### One-click Deploy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/phyzess/latch)

The deploy flow clones this public repository into your GitHub or GitLab account, builds the Worker, and provisions the `LATCH_CONFIG` Workers KV namespace from `wrangler.jsonc`.

After the deploy finishes:

1. Enable Cloudflare Access for the deployed Worker under Workers & Pages > your Worker > Settings > Domains & Routes.
2. Use the one-click Access setup modal to copy `POLICY_AUD` and `TEAM_DOMAIN`. `TEAM_DOMAIN` may be either your Access team URL or the full `.../cdn-cgi/access/certs` URL.
3. In Workers & Pages > your Worker > Settings > Variables and Secrets, set `POLICY_AUD` and `TEAM_DOMAIN` as secrets.
4. Set `LATCH_ADMIN_EMAILS` to a comma-separated list of Cloudflare Access emails that may edit links, for example `you@example.com,ops@example.com`.
5. Visit `/settings` on your deployed app, sign in through Access, and save your service YAML.

Users who pass your Cloudflare Access policy can view the launcher. Only emails listed in `LATCH_ADMIN_EMAILS` can write config in `/settings`.

### Local Wrangler Deploy

If you prefer deploying from your machine:

```sh
wrangler login
pnpm deploy
```

Then complete the same Access and `LATCH_ADMIN_EMAILS` setup above. If deploying from CI, use a Cloudflare API token with permission to deploy Workers and manage the required bindings.

### Troubleshooting Access

- `Cloudflare Access must be configured in production`: `POLICY_AUD` or `TEAM_DOMAIN` is missing. Enable one-click Access and set both values on the Worker.
- `Invalid or expired Access token`: `POLICY_AUD` or `TEAM_DOMAIN` does not match the active Access application. Reopen the Access setup modal and update the Worker secrets.
- `403` on `/settings`: your Access email is not listed in `LATCH_ADMIN_EMAILS`.
- Empty launcher after first deploy: this is normal until an admin saves YAML in `/settings`; before initialization `/services.json` returns `[]`.

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
