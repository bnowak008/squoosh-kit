# Deployment Guide

This guide covers the release process for `squoosh-kit` packages.

## Prerequisites

- Bun 1.0+ installed
- npm account with publish permissions for the `@squoosh-kit` scope
- A [trusted publisher](https://docs.npmjs.com/trusted-publishers/) configured on npm for each `@squoosh-kit/*` package

## Trusted publishing (GitHub Actions)

CI publishes with OpenID Connect. There is no long-lived `NPM_TOKEN`.

On each published package (npmjs.com → package → Settings → Trusted Publisher), add GitHub Actions with:

- Organization or user: the GitHub owner of this repository
- Repository: `squoosh-kit`
- Workflow filename: `deploy.yml` (filename only, including `.yml`)
- Allowed action: `npm publish`

The publish job in `.github/workflows/deploy.yml` already has `id-token: write` and runs on GitHub-hosted runners.

After a successful OIDC publish, restrict token-based publishing on npm and delete any leftover automation tokens.

## Release Flow

Publishing is automated via GitHub Actions on push to `main`.

### 1. Bump the version

```bash
bun run version:patch   # 0.1.x → 0.1.(x+1)
bun run version:minor   # 0.x.0 → 0.(x+1).0
bun run version:major   # x.0.0 → (x+1).0.0
```

This updates all package.json files, creates a git commit (`chore: release vX.Y.Z`), and creates a git tag (`vX.Y.Z`).

### 2. Run validation locally (recommended)

```bash
bun run validate
```

### 3. Push and merge

```bash
git push
```

Merging to `main` triggers the deploy workflow, which:

1. Builds all packages and deploys the demo site
2. Packs each workspace package with `bun pm pack` (rewrites `workspace:*` in the tarball)
3. Publishes the tarballs with `npm publish` using trusted publishing
4. Creates a git tag and GitHub Release

## CI Pipeline

- **On push to `main`**: build, deploy the site, and publish to npm if the version is new
- **`workflow_dispatch`**: same as a push to `main`

## Manual Publish (emergency only)

If CI publish fails, you can publish locally after `npm login` (interactive 2FA). This does not use OIDC:

```bash
bun run ci:build
bun run release:publish
```

## Rollback

To unpublish a broken release (within 72 hours):

```bash
npm unpublish @squoosh-kit/core@<version>
npm unpublish @squoosh-kit/webp@<version>
npm unpublish @squoosh-kit/resize@<version>
npm unpublish @squoosh-kit/runtime@<version>
npm unpublish @squoosh-kit/vite-plugin@<version>
```

Then fix the issue, bump to a new patch version, and merge to `main`.
