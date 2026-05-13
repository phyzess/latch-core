# Cloudflare Workers Static Assets

Latch deploys as a Cloudflare Worker with Static Assets and Workers KV.

## One-click Deploy

Use the Deploy to Cloudflare button in the README. The deploy flow provisions the Worker and `LATCH_CONFIG` KV namespace.

After the deploy finishes:

1. Enable Cloudflare Access for the Worker domain under Workers & Pages > your Worker > Settings > Domains & Routes.
2. Copy `POLICY_AUD` and `TEAM_DOMAIN` from the Access setup modal.
3. Set `POLICY_AUD` and `TEAM_DOMAIN` as Worker secrets.
4. Set `LATCH_ADMIN_EMAILS` to the comma-separated Access emails allowed to edit links.
5. Visit `/settings` and save your service YAML.

## Local Deploy

```sh
wrangler login
pnpm deploy
```

`wrangler.jsonc` points Workers Static Assets at `./dist`, runs the Worker first, and binds `LATCH_CONFIG`.

## Access Protection

Create a Cloudflare Access application for your Latch hostname and require your preferred identity policy. The policy must protect the full origin:

- `/`
- `/services.json`
- `/settings`
- `/api/*`
- `/_astro/*`

The Worker validates `cf-access-jwt-assertion` in production and returns `Cache-Control: no-store` for `/services.json` and API responses.
