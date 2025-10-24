# Version Sync Script Guide

The `sync-version.ts` script automatically bumps and synchronizes version numbers across all packages in the Squoosh Kit monorepo.

## Quick Start

To bump the minor version before publishing:

```bash
bun run version:minor
```

This will bump `0.0.6` → `0.1.0` across all packages.

## Available Commands

### Bump Commands

**Major version bump** (`X.0.0`):

```bash
bun run version:major
# 0.0.6 → 1.0.0
```

**Minor version bump** (`0.X.0`):

```bash
bun run version:minor
# 0.0.6 → 0.1.0
```

**Patch version bump** (`0.0.X`):

```bash
bun run version:patch
# 0.0.6 → 0.0.7
```

### Other Commands

**Check current version**:

```bash
bun run version:current
# Output: Current version: 0.0.6
```

**Set specific version** (direct command):

```bash
bun run scripts/sync-version.ts set 1.5.3
```

**Show help**:

```bash
bun run scripts/sync-version.ts --help
```

## Semantic Versioning Behavior

When bumping versions, lower-level version numbers are automatically reset to 0:

- **Major bump**: `0.2.5` → `1.0.0` (minor and patch reset)
- **Minor bump**: `1.2.5` → `1.3.0` (patch resets)
- **Patch bump**: `1.2.5` → `1.2.6` (no resets needed)

## Files Updated

The script updates version numbers in:

- Root `package.json`
- `packages/core/package.json`
- `packages/resize/package.json`
- `packages/runtime/package.json`
- `packages/webp/package.json`

## Publishing Workflow

Typical workflow before publishing:

```bash
# 1. Make your changes and commit
git commit -m "feat: add new feature"

# 2. Bump the version
bun run version:minor

# 3. Validate everything still works
bun run validate

# 4. Build and publish
bun run build
bun run release:publish
```

## Error Handling

The script validates input and will display helpful error messages:

- Invalid version format: `bun run scripts/sync-version.ts set 1.2` → Error (expects X.Y.Z)
- Missing set argument: `bun run scripts/sync-version.ts set` → Error
- Unknown command: `bun run scripts/sync-version.ts unknown` → Error

All errors are logged with `❌` prefix and exit code 1.
