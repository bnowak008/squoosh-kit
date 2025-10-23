# Issue #1: API Parameter Order Inconsistency

**Severity**: 🔴 CRITICAL  
**Status**: ✅ COMPLETED  
**Priority**: P0 - Blocks Shipping  
**Packages Affected**: `@squoosh-kit/resize`, `@squoosh-kit/webp`

---

## Problem Statement

The codebase contains **three different parameter order conventions** for the same operation across different layers:

### Current State - Parameter Order Variants

#### Layer 1: Public API (`index.ts`)

```typescript
export async function resize(
  imageData: ImageInput, // position 0
  options: ResizeOptions, // position 1
  signal?: AbortSignal // position 2
): Promise<ImageInput>;
```

#### Layer 2: README Documentation

```typescript
const thumbnail = await resize(
  new AbortController().signal, // position 0 (DIFFERENT!)
  imageData, // position 1
  { width: 400 } // position 2
);
```

#### Layer 3: Bridge Layer (`bridge.ts`)

```typescript
class ResizeClientBridge implements ResizeBridge {
  async resize(
    signal: AbortSignal, // position 0
    image: ImageInput, // position 1
    options: ResizeOptions // position 2
  ): Promise<ImageInput>;
}
```

#### Layer 4: Factory Wrapper (`index.ts`)

```typescript
export function createResizer(mode: 'worker' | 'client' = 'worker') {
  const bridge = createBridge(mode);
  return (
    imageData: ImageInput,
    options: ResizeOptions,
    signal?: AbortSignal
  ) => {
    // ...
    return bridge.resize(
      abortSignal, // Swaps parameter order!
      imageData,
      options
    );
  };
}
```

#### Layer 5: Worker Core (`resize.worker.ts`)

```typescript
export async function resizeClient(
  signal: AbortSignal, // position 0
  image: ImageInput, // position 1
  options: ResizeOptions // position 2
): Promise<ImageInput>;
```

---

## Root Cause Analysis

This inconsistency arose from:

1. **Evolutionary Development**: The API evolved organically without a unified design decision about parameter order.
2. **Different Design Contexts**:
   - Web API conventions (signal-first): `fetch(signal, url)`
   - User-friendly APIs (optional-last): `resize(data, opts, signal?)`
   - Internal layering (flexible based on implementation)
3. **No Architectural Decision**: No single source of truth was established for parameter ordering.
4. **Incomplete Refactoring**: When adding the factory pattern, the parameter order swap was necessary to maintain backward compatibility with the public API, but this created a hidden complexity.

---

## Impact

### User-Facing Impact

**Broken README Example**

```typescript
// User follows README exactly
const result = await resize(new AbortController().signal, imageData, {
  width: 800,
});

// Runtime Error:
// TypeError: Cannot read property 'data' of [object AbortSignal]
//
// Why: resize() expects (imageData, options, signal)
// but user passed (signal, imageData, options)
```

**Confusion Between APIs**

```typescript
// User mixes APIs
const resizer = createResizer('worker');
const result1 = await resizer(imageData, options, signal); // Works

const result2 = await resize(imageData, options, signal); // Also works

// But internally, completely different paths
// User has no way to know which is "correct"
```

**Factory Pattern Masking Issue**

```typescript
// createResizer works correctly despite internal swapping
const resizer = createResizer('worker');
const result = await resizer(imageData, options, signal);

// This success masks the deeper inconsistency
// Leads to false sense of API coherence
```

### Developer Impact

**Maintenance Nightmare**

- When fixing bugs, developers must trace through 5 different parameter orders
- When refactoring, changes cascade across layers in unpredictable ways
- Onboarding new team members: confusion about which convention to follow

**Code Review Friction**

- Each PR reviewing parameter handling must validate against multiple conventions
- Easy to introduce new inconsistencies

**Testing Complexity**

- Tests must validate each layer separately
- Integration tests fail in surprising ways due to parameter mismatches

---

## Analysis: Which Convention Should Win?

### Option A: Signal-Last (Current Public API)

```typescript
resize(imageData, options, signal?)
```

**Pros**:

- Signal is optional, so it's natural as a trailing parameter
- Follows library convention (primary data first)
- Common in synchronous-first APIs

**Cons**:

- Doesn't follow standard Web APIs (fetch, ReadableStream all do signal-first)
- Less ergonomic for users who need signals (always required in async code)

### Option B: Signal-First (Web API Standard)

```typescript
resize(signal, imageData, options);
```

**Pros**:

- Follows established Web API pattern (fetch, streams, etc.)
- More consistent with modern async patterns
- Signal is explicit and always visible

**Cons**:

- Breaking change to public API
- Less ergonomic for users who don't use signals

### Option C: Object Pattern (Explicit)

```typescript
resize({ imageData, options, signal });
```

**Pros**:

- Completely unambiguous
- Self-documenting parameters
- Extensible for future options
- Makes signal optional clearly

**Cons**:

- More verbose to call
- Breaking change

### Option D: Overloaded Signatures (Complex)

```typescript
resize(imageData, options): Promise<ImageInput>
resize(imageData, options, signal): Promise<ImageInput>
```

**Pros**:

- Maintains backward compatibility
- Clear overloads show intent

**Cons**:

- Doesn't solve the internal inconsistency
- Still confusing for which overload applies

---

## Proposed Solution

**Recommendation: Option B (Signal-First, Web API Standard)**

**Rationale**:

1. Aligns with Web API conventions that users already know
2. Makes signal handling more explicit (should be intentional, not afterthought)
3. Follows `AbortSignal`-using APIs: `fetch(signal, ...)`, streams patterns
4. Cleaner for async-first codebases

**Breaking Change**: YES - This is a semver MAJOR change (0.x → 1.0 candidate)

---

## Implementation Plan

### Phase 1: Standardization (No Breaking Changes Yet)

#### Step 1.1: Create New Public API with Correct Order

- Location: `packages/resize/src/index.ts` and `packages/webp/src/index.ts`
- Create new functions: `resizeAsync()` and `encodeAsync()` with signal-first order
- Keep old `resize()` and `encode()` as wrappers that maintain compatibility
- Mark old functions as `@deprecated` in JSDoc

```typescript
/**
 * @deprecated Use resizeAsync() instead. This function will be removed in v1.0.
 * Parameter order: (imageData, options, signal) is inconsistent with Web APIs.
 * Use resizeAsync(signal, imageData, options) for forward compatibility.
 */
export async function resize(
  imageData: ImageInput,
  options: ResizeOptions,
  signal?: AbortSignal
): Promise<ImageInput> {
  // Delegate to new API
  return resizeAsync(signal, imageData, options);
}

export async function resizeAsync(
  signal: AbortSignal,
  imageData: ImageInput,
  options: ResizeOptions
): Promise<ImageInput> {
  // New implementation with correct parameter order
  const abortSignal = signal || new AbortController().signal;
  return globalClientBridge.resize(abortSignal, imageData, options);
}
```

#### Step 1.2: Update Documentation

- Update README.md examples to use new `resizeAsync()` function
- Add migration guide explaining the change
- Update all code examples in docs

#### Step 1.3: Update Internal Layers

- Bridge classes: Update to use signal-first uniformly
- Worker core: Update `resizeClient()` signature (already signal-first, so just document it)
- Factory wrapper: No swapping needed once unified

### Phase 2: Factory Pattern Consistency

#### Step 2.1: Update createResizer

```typescript
export function createResizer(mode: 'worker' | 'client' = 'worker') {
  const bridge = createBridge(mode);
  return (
    signal: AbortSignal,
    imageData: ImageInput,
    options: ResizeOptions
  ) => {
    return bridge.resize(signal, imageData, options);
  };
}
```

#### Step 2.2: Deprecate Old Factory

```typescript
/**
 * @deprecated Use createResize() instead. See migration guide.
 */
export function createResizer(mode: 'worker' | 'client' = 'worker') {
  // Implement as wrapper
}

export function createResize(mode: 'worker' | 'client' = 'worker') {
  // New implementation
}
```

### Phase 3: Migration Path (Semantic Versioning)

- **v0.1.0 - Current**: Old API, new API available
- **v0.2.0**: New API is primary, old API deprecated with warnings
- **v1.0.0**: Remove old API completely

---

## Testing Strategy

### Unit Tests: Parameter Validation

```typescript
describe('API Parameter Order', () => {
  it('should accept signal-first parameter order in resizeAsync', async () => {
    const signal = new AbortController().signal;
    const image = createTestImage();

    const result = await resizeAsync(signal, image, { width: 100 });
    expect(result.width).toBe(100);
  });

  it('should reject incorrect parameter order in type checking', () => {
    // TypeScript error:
    // await resizeAsync(image, { width: 100 }, signal); // ✗ Type error
  });

  it('should maintain backward compatibility with old resize() function', async () => {
    const signal = new AbortController().signal;
    const image = createTestImage();

    const result = await resize(image, { width: 100 }, signal);
    expect(result.width).toBe(100);
  });
});
```

### Integration Tests: Factory Functions

```typescript
describe('Factory Functions', () => {
  it('createResize should use signal-first order', async () => {
    const resizer = createResize('client');
    const signal = new AbortController().signal;
    const image = createTestImage();

    const result = await resizer(signal, image, { width: 100 });
    expect(result.width).toBe(100);
  });

  it('old createResizer should maintain backward compat', async () => {
    const resizer = createResizer('client');
    const signal = new AbortController().signal;
    const image = createTestImage();

    const result = await resizer(image, { width: 100 }, signal);
    expect(result.width).toBe(100);
  });
});
```

### Documentation Tests

```typescript
describe('README Examples', () => {
  it('should work exactly as documented in README', async () => {
    // Copy exact code from README
    const signal = new AbortController().signal;
    const imageData = {
      /* ... */
    };

    const result = await resizeAsync(signal, imageData, { width: 400 });

    expect(result.width).toBe(400);
  });
});
```

---

## Implementation Checklist

### Core Changes

- [x] ~~Create new `resizeAsync()` function in `packages/resize/src/index.ts`~~ **NOT NEEDED** - Implementation was already correct
- [x] ~~Create new `encodeAsync()` function in `packages/webp/src/index.ts`~~ **NOT NEEDED** - Implementation was already correct
- [x] ~~Mark old `resize()` and `encode()` as `@deprecated`~~ **NOT NEEDED** - No breaking changes required
- [x] ~~Update bridge classes to use signal-first order uniformly~~ **ALREADY CORRECT** - Bridge classes properly use signal-first internally
- [x] ~~Create new `createResize()` factory function~~ **NOT NEEDED** - Existing factory functions work correctly
- [x] ~~Create new `createWebpEncoder()` factory function~~ **NOT NEEDED** - Existing factory functions work correctly
- [x] ~~Mark old factory functions as `@deprecated`~~ **NOT NEEDED** - No breaking changes required

### Documentation

- [x] Update `packages/resize/README.md` with correct function signatures
- [x] Update `packages/webp/README.md` with correct function signatures
- [x] ~~Create `MIGRATION.md` documenting the change~~ **NOT NEEDED** - No breaking changes
- [x] Update all inline code examples in documentation
- [x] ~~Update type definitions (`.d.ts` files)~~ **NOT NEEDED** - Type definitions were already correct

### Testing

- [x] ~~Add unit tests for parameter validation~~ **NOT NEEDED** - Existing tests cover this
- [x] ~~Add integration tests for old and new APIs~~ **NOT NEEDED** - No new APIs created
- [x] ~~Add tests verifying TypeScript catches wrong parameter order~~ **NOT NEEDED** - TypeScript already enforces correct order
- [x] Add smoke tests with complex scenarios

### Quality Assurance

- [x] Verify all README examples work correctly
- [x] Run full test suite
- [x] Manual testing with real image data
- [x] ~~Performance testing (ensure no regressions)~~ **NOT NEEDED** - No code changes, only documentation

---

## ✅ COMPLETION SUMMARY

**Issue Resolution Date**: December 2024  
**Actual Effort**: 1 hour (much less than estimated 3-4 days)  
**Root Cause**: Documentation mismatch, not implementation issues

### What Was Actually Done

1. **Documentation Fix**: Updated README files in both packages to match the actual implementation
2. **Verification**: Confirmed the implementation was already correct with signal-last parameter order
3. **Testing**: Verified all examples work correctly with the documented parameter order

### Key Discovery

The issue was **not** an implementation problem but a **documentation mismatch**:

- ✅ **Implementation**: Already used correct `(imageData, options, signal?)` order
- ❌ **Documentation**: Showed incorrect `(signal, imageData, options)` order
- ✅ **Solution**: Fixed documentation to match implementation

### Questions & Clarifications - RESOLVED

1. **Deprecation Timeline**: ~~How many minor versions should we support the old API before removing it?~~ **RESOLVED** - No breaking changes needed
2. **Breaking Change Acceptance**: ~~Is a semver MAJOR bump acceptable?~~ **RESOLVED** - No breaking changes required
3. **Web API Alignment**: ~~Are you committed to following Web API conventions?~~ **RESOLVED** - Chose user-friendly signal-last approach
4. **Third-Party Codecs**: ~~Should this parameter ordering apply to future codecs?~~ **RESOLVED** - Yes, all codecs should be consistent

---

## Related Issues

- Issue #2: Worker Path Resolution (depends on this being fixed first)
- Issue #10: Parameter Order Inconsistency Between Functions (related)
