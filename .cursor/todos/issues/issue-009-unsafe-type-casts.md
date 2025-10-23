# Issue #9: Unsafe Type Casts

**Severity**: 🟡 SIGNIFICANT  
**Status**: ✅ COMPLETED  
**Priority**: P2 - Code Quality  
**Packages Affected**: `@squoosh-kit/resize`, `@squoosh-kit/webp`, `@squoosh-kit/runtime`

---

## Problem Statement

Unsafe type casts (`as ArrayBuffer`) bypass TypeScript checking for types that may not be what we think.

### Current Code

**File: `packages/resize/src/bridge.ts` (line 76)**

```typescript
const result = await callWorker(..., [
  buffer as ArrayBuffer,  // ← What if it's SharedArrayBuffer?
]);
```

`image.data.buffer` can be:

- `ArrayBuffer` (normal)
- `SharedArrayBuffer` (worker contexts, if constructed with shared memory)
- Other types in edge cases

`SharedArrayBuffer` cannot be transferred, so the cast hides a real issue.

---

## Solution

Check actual type before casting:

```typescript
// In bridge.ts
const buffer = image.data.buffer;

if (buffer instanceof SharedArrayBuffer) {
  throw new Error(
    'Shared buffers are not supported. ' +
    'Use regular ArrayBuffer or Uint8Array instead.'
  );
}

if (!(buffer instanceof ArrayBuffer)) {
  throw new TypeError('image.data.buffer must be an ArrayBuffer');
}

// Now safe to use
const result = await callWorker(..., [buffer]);  // No cast needed!
```

---

## Implementation ✅

### Step 1: Add Buffer Validation ✅

**File**: `packages/runtime/src/validators.ts`

```typescript
export function validateArrayBuffer(
  buffer: unknown
): asserts buffer is ArrayBuffer {
  if (buffer instanceof SharedArrayBuffer) {
    throw new Error(
      'SharedArrayBuffer is not supported. ' +
        'Use regular ArrayBuffer or Uint8Array instead.'
    );
  }

  if (!(buffer instanceof ArrayBuffer)) {
    throw new TypeError('image.data.buffer must be an ArrayBuffer');
  }
}
```

### Step 2: Use Validators ✅

**Files**: `packages/resize/src/bridge.ts` and `packages/webp/src/bridge.ts`

```typescript
import { validateArrayBuffer } from '@squoosh-kit/runtime';

class ResizeWorkerBridge {
  async resize(signal, image, options) {
    const buffer = image.data.buffer;
    validateArrayBuffer(buffer);  // ← Check before use

    return callWorker(..., [buffer]);  // No cast!
  }
}
```

---

## Testing ✅

Comprehensive tests added across all packages:

### Runtime Tests (packages/runtime/test/unit.test.ts)

- ✅ Accept normal ArrayBuffer
- ✅ Accept Uint8Array backed by ArrayBuffer
- ✅ Reject SharedArrayBuffer
- ✅ Reject null
- ✅ Reject undefined
- ✅ Reject plain objects
- ✅ Reject strings
- ✅ Reject numbers

### Resize Tests (packages/resize/test/resize.test.ts)

- ✅ Buffer Validation suite (6 tests)
- ✅ Validates with normal ArrayBuffer
- ✅ Validates with Uint8Array backed by ArrayBuffer
- ✅ Rejects SharedArrayBuffer

### WebP Tests (packages/webp/test/webp.test.ts)

- ✅ Buffer Validation suite (6 tests)
- ✅ Same coverage as resize tests

---

## Implementation Checklist ✅

- [x] Add buffer validation to packages/runtime/src/validators.ts
- [x] Update resize bridge to use validation
- [x] Update webp bridge to use validation
- [x] Remove `as ArrayBuffer` casts
- [x] Add tests for SharedArrayBuffer rejection
- [x] Update error messages
- [x] All tests passing (106 pass, 5 skip, 0 fail)
- [x] No linting errors
- [x] Zero-copy optimization maintained

---

## Results

**Build Status**: ✅ 0 errors  
**Test Results**: ✅ 106/106 passing (5 WASM tests skipped as expected)  
**Linting Status**: ✅ 0 errors  
**Type Safety**: ✅ All unsafe casts removed

---

## Related Issues

- Issue #8: No Input Validation (related validation effort)
