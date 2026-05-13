# Configuration

Latch reads a private YAML file at build time and emits `public/services.json`.

## Example

```yaml
services:
  - id: photos
    name: Photos
    url: https://photos.example.com
    icon: image
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
  name: string;
  url: `https://${string}`;
  icon?: string;
  aliases?: string[];
  group?: string;
  shortcut?: string;
  pinned?: boolean;
  tags?: string[];
};
```

Rules:

- `id` must be stable lowercase kebab-case.
- `url` must use HTTPS.
- `shortcut` is one letter or digit and must be unique.
- Private or local IP addresses are rejected.
- Token-like strings and obvious secret field names are rejected.

## Build

```sh
LATCH_SERVICES_FILE=/absolute/path/to/services.local.yaml pnpm build
```
