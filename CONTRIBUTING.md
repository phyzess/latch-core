# Contributing

Thanks for helping with Latch.

## Local Setup

```sh
mise install
pnpm install --frozen-lockfile
pnpm dev
```

## Checks

Run these before opening a pull request:

```sh
pnpm validate:services
pnpm check
pnpm test
pnpm build:example
```

## Component Rules

- Use vanilla custom elements.
- Use open Shadow DOM for interactive components.
- Keep cross-component theme inputs as CSS custom properties.
- Expose stable styling hooks with `part`; do not rely on internal DOM as public API.
- Do not add React, Preact, Vue, Svelte, Tailwind, Radix, shadcn, or UI component frameworks without an explicit architecture discussion.

## Config Rules

- Commit example config only.
- Do not commit real service domains, private IPs, tokens, cookies, passwords, API keys, or personal notes.
- Keep `public/services.json` generated and untracked.
