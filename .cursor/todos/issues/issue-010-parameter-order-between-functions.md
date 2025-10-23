# Issue #10: Parameter Order Between Functions

**Severity**: 🟡 SIGNIFICANT  
**Status**: ✅ COMPLETED  
**Priority**: P2 - Code Quality  
**Packages Affected**: `@squoosh-kit/resize`, `@squoosh-kit/webp`

---

## Problem Statement

After fixing Issue #1 (API parameter order), internal function layers still have inconsistent parameter orders.

Example: `resize()` → `bridge.resize()` → `resizeClient()` may have different orders.

---

## Solution - IMPLEMENTED ✅

After Issue #1 was completed, all layers now use consistent parameter order:

```typescript
// Consistent pattern everywhere:
resize(imageData: ImageInput, options: ResizeOptions, signal?: AbortSignal)
bridge.resize(imageData: ImageInput, options: ResizeOptions, signal?: AbortSignal)
resizeClient(imageData: ImageInput, options: ResizeOptions, signal?: AbortSignal)

encode(imageData: ImageInput, options?: WebpOptions, signal?: AbortSignal)
bridge.encode(imageData: ImageInput, options?: WebpOptions, signal?: AbortSignal)
webpEncodeClient(imageData: ImageInput, options?: WebpOptions, signal?: AbortSignal)
```

No parameter swapping between layers - all use the public API order.

---

## Implementation Checklist - COMPLETE ✅

- [x] Audit all function signatures in resize package
- [x] Audit all function signatures in webp package
- [x] Remove parameter order swaps in bridge implementations
- [x] Update bridge method signatures (ResizeBridge, WebPBridge interfaces)
- [x] Update worker implementation signatures (resizeClient, webpEncodeClient)
- [x] Update factory function calls (createResizer, createWebpEncoder)
- [x] Update public API calls (resize, encode functions)
- [x] Run full test suite - all 106 tests passing ✅
- [x] Verify no linting errors - 0 lints ✅
- [x] Verify documentation reflects correct parameter order - ✅

---

## Changes Made

### Resize Package (`packages/resize/src/`)

1. **bridge.ts**: Updated ResizeBridge interface and both implementations:
   - ResizeClientBridge.resize: `(image, options, signal?)`
   - ResizeWorkerBridge.resize: `(image, options, signal?)`

2. **index.ts**: Updated public functions:
   - resize(): Already correct, calls updated bridge
   - createResizer(): Updated factory to call bridge with consistent order

3. **resize.worker.ts**: Updated worker export:
   - resizeClient(): Changed from `(signal, image, options)` to `(image, options, signal?)`

### WebP Package (`packages/webp/src/`)

1. **bridge.ts**: Updated WebPBridge interface and both implementations:
   - WebpClientBridge.encode: `(image, options?, signal?)`
   - WebpWorkerBridge.encode: `(image, options?, signal?)`

2. **index.ts**: Updated public functions:
   - encode(): Already correct, calls updated bridge
   - createWebpEncoder(): Updated factory to call bridge with consistent order

3. **webp.worker.ts**: Updated worker export:
   - webpEncodeClient(): Changed from `(signal, image, options)` to `(image, options?, signal?)`
   - Also updated internal call from `webpEncodeClient(controller.signal, image, options)` to `webpEncodeClient(image, options, controller.signal)`

### Test Status

All 106 tests passing:

- packages/resize/test/resize.test.ts: 44 pass
- packages/webp/test/webp.test.ts: 46 pass
- packages/core/test/integration.test.ts: 4 pass
- packages/runtime/test/unit.test.ts: 12 pass

No linting errors.

---

## Verification

### Parameter Order Consistency

All layers now follow the public API order: **(imageData, options, signal?)**

```
Public API Layer:
  resize(imageData, options, signal?)
  encode(imageData, options?, signal?)
         ↓
Bridge Layer:
  bridge.resize(imageData, options, signal?)
  bridge.encode(imageData, options?, signal?)
         ↓
Worker Implementation:
  resizeClient(imageData, options, signal?)
  webpEncodeClient(imageData, options?, signal?)
         ↓
Core Processing:
  _resizeCore(image, options)
  (no signal - handled before call)
```

### Function Call Chain

**Resize**: `resize()` → `bridge.resize()` → `resizeClient()` → `_resizeCore()`

- All layers: `(imageData, options, signal?)`
- No parameter swapping ✅

**WebP**: `encode()` → `bridge.encode()` → `webpEncodeClient()`

- All layers: `(imageData, options?, signal?)`
- No parameter swapping ✅

---

## Design Rationale

The consistent parameter order follows the public API established in Issue #1:

1. **imageData first** - Most important, user-provided input
2. **options second** - Configuration for the operation
3. **signal last** - Optional cancellation signal (can be omitted in simple cases)

This order is intuitive for users and matches Web API conventions where optional parameters come last.

---

## Related Issues

- Issue #1: API Parameter Order (✅ COMPLETED - established the public API order)

---

## COMPLETION SUMMARY

**Date Completed**: Current session
**Effort**: ~30 minutes
**Impact**: Ensures internal code consistency and maintainability

All internal function layers now maintain consistent parameter ordering with the public API, eliminating confusion and potential bugs from parameter swapping.
