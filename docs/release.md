# Release

`phyzess/latch-core` is the source of truth for the Latch runtime package
published as `@phyzess/latch`.

The deployment chain is:

```text
phyzess/latch-core -> npm @phyzess/latch -> deployment instance repo -> Cloudflare Worker
```

`phyzess/latch` is the reusable deployment template. Deployment instances, such
as `phyzess/ilatch`, pin a released `@phyzess/latch` version and keep their own
Worker name, KV namespace bindings, admin emails, and Cloudflare secrets.

## Version Discipline

Only bump `package.json` when preparing a release. During ordinary feature work,
keep unreleased runtime changes separate from the release version bump so it is
clear which version is actually published on npm and deployed by instance
repositories.

Before publishing, compare the local version with npm:

```sh
npm view @phyzess/latch version
```

## Preflight

From `phyzess/latch-core`:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm pack:check
```

`pnpm pack:check` builds the package and verifies the archive contents without
publishing.

## Publish

1. Update `package.json` to the next semver version.
2. Refresh the lockfile if the version bump changes it:

```sh
pnpm install --lockfile-only
```

3. Run the preflight commands again after the version bump.
4. Publish the runtime package:

```sh
npm publish --access public
```

5. Verify npm sees the new version:

```sh
npm view @phyzess/latch version
```

If the local network routes npm through a company registry, publish from GitHub
Actions instead. Configure npm Trusted Publishing for `@phyzess/latch` with:

- Organization or user: `phyzess`
- Repository: `latch-core`
- Workflow filename: `publish-runtime.yml`
- Allowed action: `npm publish`

Then run the `Publish Runtime` workflow on the release commit. The workflow uses
GitHub-hosted runners, npm OIDC, and `https://registry.npmjs.org`, so it does
not depend on local npm registry settings or long-lived npm tokens.

## Update Deployment Instances

After the new runtime is published, update deployment instances rather than
copying runtime code into them.

For `phyzess/ilatch`, run the `Update Latch Runtime` GitHub Actions workflow
manually or wait for its scheduled run. The workflow:

1. Checks npm for the latest `@phyzess/latch` version.
2. Updates `package.json` and `pnpm-lock.yaml`.
3. Runs `pnpm build`.
4. Runs `pnpm doctor`.
5. Commits and pushes the dependency bump.

Cloudflare Workers Builds redeploys the connected Worker after the bump commit
lands on the production branch.

## Update the Template Only When Needed

Do not update `phyzess/latch` for ordinary runtime releases. Users and
deployment instances receive runtime updates through `@phyzess/latch`.

Update `phyzess/latch` only when the deployment wrapper changes, such as:

- `wrangler.jsonc` structure or required bindings
- workflow changes
- documentation for the template import flow
- wrapper `worker.ts` changes
- template-only scripts or metadata

If the template changes affect existing deployment instances, apply the same
wrapper change to those instances as a separate maintenance update.
