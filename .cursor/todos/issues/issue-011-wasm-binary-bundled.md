# Issue #11: WASM Binary Bundled

**Severity**: 🟡 SIGNIFICANT  
**Status**: ✅ COMPLETED  
**Priority**: P3 - Optimization  
**Packages Affected**: `@squoosh-kit/resize`, `@squoosh-kit/webp`

---

## Problem Statement

WASM binary files (`*.wasm`) are always included in npm packages even when not used. Users downloading the package don't realize they're downloading 30-50KB of binary that might never be executed.

### Example

```bash
npm install @squoosh-kit/resize
# Downloads ~40-50KB gzipped
# Includes WASM binary even if user only uses client mode
```

### Real Impact

- Extra 40-50KB on every install
- Mobile web: extra ~5 seconds on slow 3G
- Edge runtime (Cloudflare, Vercel): bump against size limits
- 1000 installs = 40-50MB of duplicate downloads

---

## Solution Options

### Option A: Separate Packages
- `@squoosh-kit/resize` (no WASM)
- `@squoosh-kit/resize-with-workers` (includes WASM)

Pros: Users choose what they need  
Cons: More packages to maintain

### Option B: Lazy Download
- Don't include WASM in package
- Download from CDN on first use
- Cache locally

Pros: Users only download if used  
Cons: Requires external service, adds latency

### Option C: Optional Dependency
- WASM in optional dependency
- Installed with `npm install --save-optional`

Pros: Users can opt-in  
Cons: Confusing, not standard

### Option D: Document Removal
- Include WASM (current)
- Document how to remove for client-only use

Pros: Simple, no breaking changes  
Cons: Many users won't know about it

---

## Recommended Solution

**Option D (Documentation) + Optional C (for future)** ✅ **IMPLEMENTED**

For v0.x: Document in README how to remove WASM if not needed  
For v1.0+: Consider Option A or B

---

## Implementation ✅ COMPLETED

### Step 1: Document in Main README ✅

Added "Package Size & Download Reduction" section to `/README.md` with:
- Clear explanation of WASM binary inclusion (~30-50KB gzipped)
- Size breakdown: JS (~10-15KB), types (~5KB), WASM (~30-50KB)
- Instructions to remove WASM for client-mode-only users
- Important warnings about worker mode requirements
- Future vision for v1.0+ separate packages

### Step 2: Document in Package READMEs ✅

**WebP Package** (`packages/webp/README.md`):
- Added "Package Size" section
- WebP-specific WASM size (~30-40KB gzipped)
- Removal instructions: `rm -rf node_modules/@squoosh-kit/webp/dist/wasm/`
- Clear warning about worker mode dependency

**Resize Package** (`packages/resize/README.md`):
- Added "Package Size" section
- Resize-specific WASM size (~30-50KB gzipped)
- Removal instructions: `rm -rf node_modules/@squoosh-kit/resize/dist/wasm/`
- Clear warning about worker mode dependency

### Step 3: Future Plans Documented ✅

Added section to main README outlining v1.0+ strategy:
- `@squoosh-kit/resize-core` (client only, ~10KB)
- `@squoosh-kit/resize` (with WASM, ~50KB)
- Gives users choice without breaking current API

---

## Implementation Checklist

- [x] Update README with size information
- [x] Document how to remove WASM if not needed
- [x] Add comment to build output explaining binary files
- [x] Consider documenting per-file breakdown
- [x] Evaluate Option A/B for future versions

---

## Completion Summary

✅ **All documentation complete and deployed across:**
- Main README with comprehensive size guide
- WebP package README with specific guidance
- Resize package README with specific guidance
- Future v1.0+ roadmap documented

✅ **Users now have:**
- Clear understanding of what they're downloading
- Instructions for optional WASM removal
- Warnings about mode requirements
- Visibility into future improvements

✅ **Zero breaking changes** - all updates are informational

---

## Related Issues

None

---

## Future Consideration

For v1.0+, consider creating separate packages:
- `@squoosh-kit/resize-core` (client only, ~10KB)
- `@squoosh-kit/resize` (with WASM, ~50KB)

This gives users choice without breaking current API.
