# Deployment Guide

This guide covers the release process for `squoosh-kit` packages.

## Prerequisites

- Bun 1.0+ installed
- npm account with publish permissions for the `@squoosh-kit` scope
- `NPM_TOKEN` secret configured in GitHub repository settings

## GitHub Secrets

Ensure the following secret is configured in your repository (Settings → Secrets and variables → Actions):

- `NPM_TOKEN`: npm token with publish access to `@squoosh-kit/*`

## Release Flow

Publishing is tag-triggered and fully automated via GitHub Actions.

### 1. Bump the version

```bash
bun run version:patch   # 0.1.x → 0.1.(x+1)
bun run version:minor   # 0.x.0 → 0.(x+1).0
bun run version:major   # x.0.0 → (x+1).0.0
```

This updates all 5 `package.json` files, creates a git commit (`chore: release vX.Y.Z`), and creates a git tag (`vX.Y.Z`).

### 2. Run validation locally (recommended)

```bash
bun run validate
```

### 3. Push the tag

```bash
git push --follow-tags
```

Pushing the tag triggers the CI pipeline which:
1. Runs tests, type checks, lint, and bundle size checks
2. Builds all packages
3. Publishes all 5 packages to npm

## CI Pipeline

- **On push to `main`/`develop` or PR**: runs tests, lint, type check, build, and bundle size check
- **On tag push (`v*`)**: same checks + publishes to npm if tests pass

## Manual Publish (emergency only)

If CI publish fails, you can publish manually after building locally:

```bash
bun run ci:build
NPM_CONFIG_TOKEN=<your-token> bun run release:publish
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

Then fix the issue, bump to a new patch version, and push the new tag.
