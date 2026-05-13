# Latch

Latch is a private launch surface for self-hosted web services. It is built as a static Astro app with vanilla Web Components, open Shadow DOM, and a private service list generated at build time.

## Stack

- Astro `6.3.1`
- TypeScript `6.0.3`
- Vanilla Custom Elements with open Shadow DOM
- Valibot for service config validation
- Cloudflare Workers Static Assets for deployment
- mise for local toolchain management

## Quick Start

```sh
mise install
pnpm install --frozen-lockfile
pnpm dev
```

The development server uses `config/services.example.yaml`.

## Private Config

Real service lists must not be committed. Create a local ignored file:

```sh
cp config/services.example.yaml config/services.local.yaml
```

Then build with:

```sh
LATCH_SERVICES_FILE=config/services.local.yaml pnpm build
```

The build generates `public/services.json`, which is also ignored by git.

## Security Boundary

Your service list is sensitive. Production deployments should place Cloudflare Access, or an equivalent identity-aware proxy, in front of the whole Latch domain. Unauthenticated users should not be able to fetch `/` or `/services.json`.

Latch never stores service passwords, tokens, cookies, or credentials.

## Useful Commands

```sh
pnpm validate:services
pnpm check
pnpm test
LATCH_SERVICES_FILE=config/services.local.yaml pnpm build
```

## License

MIT
