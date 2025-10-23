# Issue #13: Internal Exports Create Confusion

**Severity**: 🟡 SIGNIFICANT  
**Status**: ✅ COMPLETED  
**Priority**: P3 - API Clarity  
**Packages Affected**: `@squoosh-kit/resize`, `@squoosh-kit/webp`

---

## Problem Statement

Functions marked "not for public consumption" are exported and available in IDE autocomplete, causing user confusion.

### Current Code

**File: `packages/resize/src/index.ts` (line 55)**

```typescript
// Export the client-side implementation for direct use by the bridge.
// This is not intended for public consumption.
export { resizeClient } from './resize.worker';
```

### The Issue

Users see `resizeClient` in autocomplete and think it's part of the public API:

```typescript
import { resize, resizeClient, createResizer } from '@squoosh-kit/resize';

// User thinks this is an alternative API
const result = await resizeClient(signal, imageData, options);
// But it has different parameter order than resize()!
// And it's marked "not for public consumption"
```

---

## Solution Options

### Option A: Don't Export It

```typescript
// Remove the export entirely
// Users who need it can access via private imports (their problem)
```

Pros: Clear API surface  
Cons: Breaks anyone using it

### Option B: Export with Different Name

```typescript
export { resizeClient as _resizeClient }; // Private convention
```

Pros: Clear it's internal  
Cons: Still discoverable

### Option C: Hide in Documentation Only

```typescript
export { resizeClient };
/**
 * @internal
 * Internal implementation. Do not use.
 */
export { resizeClient };
```

Pros: TypeScript/IDE honors @internal  
Cons: Requires setup

### Option D: Export from Separate Entry Point

```typescript
// In index.ts - public API only
export { resize, createResizer };

// In internals.ts - internal only
export { resizeClient };

// Users import: import { resizeClient } from '@squoosh-kit/resize/internals'
```

Pros: Clear separation  
Cons: Adds complexity

---

## Recommended Solution

**Option A (Don't Export) after Issue #1 is fixed**

Once Issue #1 fixes the parameter order consistency, there's no need to expose `resizeClient` at all.

---

## Implementation

### Step 1: Remove Internal Exports

**File**: `packages/resize/src/index.ts`

```typescript
// BEFORE:
export { resizeClient } from './resize.worker';

// AFTER:
// Don't export resizeClient - it's internal to the bridge
```

**File**: `packages/webp/src/index.ts` (same)

### Step 2: Update Tests

If any tests import `resizeClient` directly, update them to use public APIs only.

### Step 3: Update Documentation

```markdown
## Public API

Only the following are part of the public API:

- `resize(imageData, options, signal?)`
- `encode(imageData, options, signal?)`
- `createResizer(mode?)`
- `createWebpEncoder(mode?)`

Internal implementation details (resizeClient, encodeClient, etc.) are not stable across versions.
```

---

## Implementation Checklist

- [x] Remove `resizeClient` export from `packages/resize/src/index.ts`
- [x] Remove `resizeClient` export from `packages/webp/src/index.ts`
- [x] Check for tests using internal exports
- [x] Update any tests to use public API
- [x] Update documentation to list only public API
- [x] Verify TypeScript definitions don't leak internals

---

## Completion Summary

**Completed**: Issue #13 has been fully resolved. All internal exports have been removed from the public API.

### Changes Made

#### 1. Removed Internal Exports

- **`packages/resize/src/index.ts`**: Removed `export { resizeClient } from './resize.worker'`
- **`packages/webp/src/index.ts`**: Removed `export { webpEncodeClient } from './webp.worker'`

These exports were marked as "not for public consumption" but were still exported and visible in IDE autocomplete, creating confusion about the public API.

#### 2. Internal Functions Still Work

The functions `resizeClient` and `webpEncodeClient` are still available internally:

- They are imported directly by the bridge modules (`packages/resize/src/bridge.ts` and `packages/webp/src/bridge.ts`)
- They are NOT exposed to end users
- No breaking changes to internal communication

#### 3. Updated Documentation

Added comprehensive "Public API" sections to both package READMEs:

**`packages/resize/README.md`:**

```markdown
## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `resize(imageData, options, signal?)` - Resize an image
- `createResizer(mode?)` - Create a reusable resizer function
- `ImageInput` type - Input image data structure
- `ResizeOptions` type - Resize configuration options
- `ResizerFactory` type - Type for reusable resizer functions

Internal implementation details (such as `resizeClient`) are not part of the public API and may change without notice.
```

**`packages/webp/README.md`:**

```markdown
## Public API

Only the following exports are part of the public API and guaranteed to be stable across versions:

- `encode(imageData, options?, signal?)` - Encode an image to WebP format
- `createWebpEncoder(mode?)` - Create a reusable encoder function
- `ImageInput` type - Input image data structure
- `WebpOptions` type - WebP encoding configuration options
- `WebpEncoderFactory` type - Type for reusable encoder functions

Internal implementation details (such as `webpEncodeClient`) are not part of the public API and may change without notice.
```

#### 4. Verification

- ✅ No tests import internal exports directly (verified via grep)
- ✅ TypeScript definitions only export public API (verified in `.d.ts` files)
- ✅ All 124 tests pass
- ✅ Build completes without errors
- ✅ No imports of `resizeClient` or `webpEncodeClient` from public packages

### Impact Assessment

**Users (Positive):**

- IDE autocomplete now shows only the intended public API
- No confusion about internal vs. public functions
- Clear documentation of what is stable and what isn't

**Internal Code (No Impact):**

- Bridge modules still have access to `resizeClient` and `webpEncodeClient` via direct imports
- All internal communication unchanged
- No breaking changes to functionality

**Future Maintenance (Positive):**

- Clear contract between public and internal APIs
- Freedom to refactor internal implementation without breaking users
- Prepared for monorepo evolution where each feature becomes a separate package

---

## Related Issues

- Issue #1: API Parameter Order (after fix, this becomes safe to remove)
