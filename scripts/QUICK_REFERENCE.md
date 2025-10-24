# Version Sync - Quick Reference

## For Publishing

Before publishing your packages, bump the version:

```bash
# For a new feature release (0.0.6 → 0.1.0)
bun run version:minor

# For a hotfix/patch (0.0.6 → 0.0.7)
bun run version:patch

# For a major release (0.0.6 → 1.0.0)
bun run version:major
```

## Typical Publishing Workflow

```bash
# 1. Check current version
bun run version:current

# 2. Bump version (choose one)
bun run version:minor    # or version:patch or version:major

# 3. Validate code quality
bun run validate

# 4. Build and publish
bun run build
bun run release:publish
```

## All Available Commands

| Command                                     | Effect               | Example         |
| ------------------------------------------- | -------------------- | --------------- |
| `bun run version:current`                   | Show current version | `0.0.6`         |
| `bun run version:major`                     | Bump major (X.0.0)   | `0.0.6 → 1.0.0` |
| `bun run version:minor`                     | Bump minor (0.X.0)   | `0.0.6 → 0.1.0` |
| `bun run version:patch`                     | Bump patch (0.0.X)   | `0.0.6 → 0.0.7` |
| `bun run scripts/sync-version.ts set X.Y.Z` | Set specific version | `set 2.1.5`     |
| `bun run scripts/sync-version.ts --help`    | Show full help       | -               |

## What Gets Updated

✅ Root `package.json`  
✅ `packages/core/package.json`  
✅ `packages/resize/package.json`  
✅ `packages/runtime/package.json`  
✅ `packages/webp/package.json`

All in one command! 🚀
