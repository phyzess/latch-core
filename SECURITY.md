# Security Policy

Latch is a self-hosted launcher. The service list can reveal private infrastructure and should be treated as sensitive.

## Reporting Security Issues

Please do not open a public issue with real service domains, private IPs, Access policies, tokens, cookies, passwords, or screenshots that reveal private routes.

Open a private advisory if the repository host supports it, or contact the maintainer privately.

## Deployment Requirements

Production deployments should protect the full Latch origin with Cloudflare Access or an equivalent identity-aware proxy. The protection must cover both `/` and `/services.json`.

## Non-Goals

Latch does not store or proxy service credentials. Each linked service remains responsible for its own authentication.
