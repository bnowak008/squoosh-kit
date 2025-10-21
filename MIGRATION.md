# Migration Guide

## Migrating to New Package Imports

This guide helps you migrate from the old subpath imports to the new package-based imports.

### Before (Old Style)

```typescript
import { createWebpEncoder } from '@squoosh-lite/core/webp';
import { createResizer } from '@squoosh-lite/core/resize';
```

### After (New Style - Recommended)

```typescript
import { createWebpEncoder } from '@squoosh-lite/webp';
import { createResizer } from '@squoosh-lite/resize';
```

### Installation

Update your package.json dependencies:

**Old:**
```json
{
  "dependencies": {
    "@squoosh-lite/core": "^0.1.0"
  }
}
```

**New:**
```json
{
  "dependencies": {
    "@squoosh-lite/webp": "^0.1.0",
    "@squoosh-lite/resize": "^0.1.0"
  }
}
```

Or install only what you need:

```bash
# For WebP encoding only
bun add @squoosh-lite/webp

# For image resizing only
bun add @squoosh-lite/resize

# For both
bun add @squoosh-lite/webp @squoosh-lite/resize
```

### Benefits

- **Cleaner imports**: Direct package names instead of subpaths
- **Better tree-shaking**: Only install what you need
- **Easier discovery**: Each package is independently discoverable on npm
- **Smaller bundle sizes**: Only bundle the codecs you actually use

### Backward Compatibility

The old `@squoosh-lite/core` package still works and supports subpath imports:

```typescript
import { createWebpEncoder } from '@squoosh-lite/core/webp';
import { createResizer } from '@squoosh-lite/core/resize';
```

Both styles will continue to be supported, but the new package-based imports are recommended for new projects.

### Complete Example

**Before:**

```typescript
import { createWebpEncoder } from '@squoosh-lite/core/webp';
import { createResizer } from '@squoosh-lite/core/resize';

const resizer = createResizer('client');
const encoder = createWebpEncoder('client');

const controller = new AbortController();
const resized = await resizer(controller.signal, imageData, { width: 800 });
const webp = await encoder(controller.signal, resized, { quality: 85 });
```

**After:**

```typescript
import { createWebpEncoder } from '@squoosh-lite/webp';
import { createResizer } from '@squoosh-lite/resize';

const resizer = createResizer('client');
const encoder = createWebpEncoder('client');

const controller = new AbortController();
const resized = await resizer(controller.signal, imageData, { width: 800 });
const webp = await encoder(controller.signal, resized, { quality: 85 });
```

Notice that only the import statements change - the API remains exactly the same!
