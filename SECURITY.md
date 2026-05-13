# Security Policy

Latch is a self-hosted launcher. The service list can reveal private infrastructure and should be treated as sensitive.

## Reporting Security Issues

Please do not open a public issue with real service domains, private IPs, Access policies, tokens, cookies, passwords, or screenshots that reveal private routes.

Open a private advisory if the repository host supports it, or contact the maintainer privately.

## Deployment Requirements

Production deployments must protect the full Latch origin with Cloudflare Access. The protection must cover `/`, `/services.json`, `/settings`, `/api/*`, and `/_astro/*`.

Latch also validates the Cloudflare Access JWT in the Worker outside local development. Missing or invalid Access configuration fails closed.

Only users whose Access email appears in `LATCH_ADMIN_EMAILS` can edit or roll back service config.

## Non-Goals

Latch does not store or proxy service credentials. Each linked service remains responsible for its own authentication.
