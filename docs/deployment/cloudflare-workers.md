# Cloudflare Workers Static Assets

Latch deploys as static assets on Cloudflare Workers.

## Build

```sh
LATCH_SERVICES_FILE=config/services.local.yaml pnpm build
```

## Deploy

```sh
wrangler login
LATCH_SERVICES_FILE=config/services.local.yaml pnpm deploy
```

`wrangler.jsonc` points Workers Static Assets at `./dist`.

## Access Protection

Create a Cloudflare Access self-hosted application for your Latch hostname and require your preferred identity policy. The policy must protect:

- `/`
- `/services.json`
- `/_astro/*`

`/services.json` is emitted with `Cache-Control: no-store` through `public/_headers`.
