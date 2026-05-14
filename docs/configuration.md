# Configuration

Latch stores its service list in Cloudflare Workers KV and serves it at runtime from `/services.json`.

Production config is edited from `/settings`. The editor stores both the raw YAML and the normalized service JSON in the `LATCH_CONFIG` KV namespace.

## Example

```yaml
services:
  - id: photos
    url: https://photos.example.com
    aliases:
      - pictures
    group: Media
    shortcut: "1"
    pinned: true
    tags:
      - media
```

## Fields

```ts
type ServiceEntry = {
  id: string;
  name?: string;
  url: `https://${string}`;
  icon?: string;
  aliases?: string[];
  group?: string;
  shortcut?: string;
  pinned?: boolean;
  tags?: string[];
};
```

`name` and `icon` are optional overrides. When config is saved through the Worker, Latch resolves missing names from the linked page title, falls back to the hostname, and stores a discovered favicon URL when no built-in `icon` is configured.

Rules:

- `id` must be stable lowercase kebab-case.
- `url` must use HTTPS.
- `shortcut` is one letter or digit and must be unique.
- Private or local IP addresses are rejected.
- Token-like strings and obvious secret field names are rejected.

## Build

```sh
LATCH_SERVICES_FILE=/absolute/path/to/services.local.yaml pnpm validate:services:input
```

The CLI validates local files with the same schema used by the Worker. It is not required for production deployment.
