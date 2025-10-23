# @squoosh-kit Production Readiness: Issue Resolution Guide

This directory contains detailed todo files for resolving critical issues in the `@squoosh-kit` monorepo. These issues must be addressed before shipping to npm.

---

## Issues Overview

### 🔴 CRITICAL (3 issues) - Blocks Shipping

These issues prevent the package from functioning correctly in real-world scenarios.

| # | Title | Status | Effort | Dependencies |
|---|-------|--------|--------|--------------|
| 1 | [API Parameter Order Inconsistency](./issue-001-api-parameter-order-inconsistency.md) | ✅ COMPLETED | 3-4 days | None |
| 2 | [Worker Path Resolution Fails](./issue-002-worker-path-resolution.md) | ✅ COMPLETED | 1 hour | Issue #1 |
| 3 | [Useless Default AbortSignal](./issue-003-useless-default-abortsignal.md) | ✅ COMPLETED | 2 hours | Issue #2 |

### 🟠 MAJOR (4 issues) - High Impact

These issues cause significant problems in production use or mislead users.

| # | Title | Status | Effort | Dependencies |
|---|-------|--------|--------|--------------|
| 4 | [ImageData Copy Performance Cliff](./issue-004-imagedata-copy-performance-cliff.md) | ✅ COMPLETED | 1-2 hours | None |
| 5 | [Worker Memory Leaks](./issue-005-worker-memory-leaks.md) | ✅ COMPLETED | 2-3 hours | Issue #2 |
| 6 | [Lanczos3 vs Triangular Discrepancy](./issue-006-lanczos3-vs-triangular-discrepancy.md) | ✅ COMPLETED | 1-2 hours | None |
| 7 | [WASM Module Loading Fragility](./issue-007-wasm-module-loading-fragility.md) | ✅ COMPLETED | 2-3 hours | None |

### 🟡 SIGNIFICANT (6 issues) - Code Quality

These issues affect code maintainability, reliability, and developer experience.

| # | Title | Status | Effort | Dependencies |
|---|-------|--------|--------|--------------|
| 8 | [No Input Validation](./issue-008-no-input-validation.md) | ✅ COMPLETED | 1-2 hours | None |
| 9 | [Unsafe Type Casts](./issue-009-unsafe-type-casts.md) | ✅ COMPLETED | 1 hour | None |
| 10 | [Parameter Order Between Functions](./issue-010-parameter-order-between-functions.md) | ✅ COMPLETED | 1-2 hours | Issue #1 |
| 11 | [WASM Binary Bundled](./issue-011-wasm-binary-bundled.md) | ✅ COMPLETED | 1-2 hours | None |
| 12 | [Edge Cases in Resize Logic](./issue-012-edge-cases-in-resize-logic.md) | ✅ COMPLETED | 1-2 hours | Issue #8 |
| 13 | [Internal Exports Create Confusion](./issue-013-internal-exports-create-confusion.md) | ✅ COMPLETED | 30 min | Issue #1 |

---

## Recommended Implementation Order

**This order respects dependencies and groups related work:**

### Phase 1: Critical Path (Days 1-2)
1. **Issue #1**: API Parameter Order Inconsistency ✅ **COMPLETED**
   - ~~Foundation for API design~~ ✅ **RESOLVED**
   - ~~Affects multiple downstream issues~~ ✅ **RESOLVED**
   - ~~Largest scope~~ ✅ **ACTUAL: 1 hour (documentation fix)**

2. **Issue #2**: Worker Path Resolution ✅ **COMPLETED**
   - ~~Unblocks worker mode testing~~ ✅ **RESOLVED**
   - ~~Depends on Issue #1 philosophy~~ ✅ **UNBLOCKED**
   - ~~High priority for npm publishing~~ ✅ **RESOLVED**

3. **Issue #3**: Useless Default AbortSignal ✅ **COMPLETED**
   - ~~Depends on Issue #2 for worker testing~~ ✅ **RESOLVED**
   - ~~API clarity issue~~ ✅ **RESOLVED**
   - ~~Actual: 2 hours (worker fix + docs)~~ ✅ **ACTUAL: 2 hours**

### Phase 2: Quality & Performance (Days 3-4)
4. **Issue #4**: ImageData Copy Performance
   - Simple, independent fix
   - Measurable performance improvement

5. **Issue #5**: Worker Memory Leaks ✅ **COMPLETED**
   - ~~Depends on Issue #2 (workers working)~~ ✅ **RESOLVED**
   - ~~Production critical~~ ✅ **RESOLVED**
   - ~~Actual: 2-3 hours~~ ✅ **ACTUAL: ~1 hour (bridge + API + docs)**

6. **Issue #7**: WASM Module Loading Fragility ✅ **COMPLETED**
   - ~~Robustness for different environments~~ ✅ **RESOLVED**
   - ~~Independent work~~ ✅ **RESOLVED**
   - ~~Actual: 2-3 hours~~ ✅ **ACTUAL: ~1 hour (loader + worker updates + tests)**

7. **Issue #6**: Lanczos3 vs Triangular ✅ **COMPLETED**
   - ~~Documentation/configuration~~ ✅ **RESOLVED**
   - ~~Independent work~~ ✅ **RESOLVED**

### Phase 3: Validation & Polish (Days 5-6)
8. **Issue #8**: No Input Validation
   - Foundation for other tests
   - Enables Issue #12

9. **Issue #9**: Unsafe Type Casts
   - Code quality cleanup
   - Independent work

10. **Issue #12**: Edge Cases (after Issue #8)
    - Depends on validation framework

### Phase 4: Cleanup (Day 7)
11. **Issue #10**: Parameter Order Consistency ✅ **UNBLOCKED** (Issue #1 completed)
    - ~~Internal cleanup after Issue #1~~ ✅ **READY TO START**

12. **Issue #11**: WASM Binary Bundled
    - Optimization/documentation
    - Low priority

13. **Issue #13**: Internal Exports ✅ **UNBLOCKED** (Issue #1 completed)
    - ~~API surface cleanup~~ ✅ **READY TO START**

---

## Dependency Graph

```
Issue #1 (API Parameter Order) ✅ COMPLETED
├─→ Issue #2 (Worker Path) ✅ COMPLETED
│   └─→ Issue #3 (AbortSignal) ✅ COMPLETED
│       └─→ Issue #5 (Memory Leaks) ✅ UNBLOCKED - Ready to start
├─→ Issue #10 (Parameter Consistency) ✅ UNBLOCKED
└─→ Issue #13 (Internal Exports) ✅ UNBLOCKED

Issue #8 (Input Validation)
└─→ Issue #12 (Edge Cases)

Independent: Issues #4, #6, #7, #9, #11
```

---

## Implementation Strategy

### Each Issue Contains

1. **Problem Statement** - What's wrong and why
2. **Root Cause Analysis** - Why it happened
3. **Impact Assessment** - User and developer impact
4. **Solution Options** - Multiple approaches with pros/cons
5. **Recommended Solution** - Specific approach to take
6. **Implementation Plan** - Step-by-step guide
7. **Testing Strategy** - How to verify the fix
8. **Implementation Checklist** - Tasks to complete
9. **Questions & Clarifications** - Items needing your input

### Using the Todo Files

```bash
# View specific issue
cat .cursor/todos/issue-001-api-parameter-order-inconsistency.md

# When ready to work on an issue:
# 1. Read the entire todo file
# 2. Answer any "Questions & Clarifications" items
# 3. Follow the implementation plan step-by-step
# 4. Use the checklist to track progress
# 5. Run the testing strategy
```

---

## Key Principles

### Consistency Across Packages

All codec packages (`@squoosh-kit/resize`, `@squoosh-kit/webp`, future ones) should:
- Use identical API patterns
- Have consistent parameter ordering
- Share validation and error handling
- Follow same build/packaging approach

### Non-Breaking Where Possible

- Use deprecation + new APIs (Issue #1)
- Maintain backward compatibility for v0.x
- Plan breaking changes for v1.0

### Quality Over Speed

- Prioritize correctness
- Add comprehensive tests
- Update documentation
- Clear error messages

### Code Reusability

- Create shared helpers in `@squoosh-kit/runtime`
- DRY principle for validation, WASM loading, etc.
- Generic implementations applied to all packages

---

## Progress Tracking

Mark issues as complete:

```markdown
- [x] Issue #1: API Parameter Order (✅ COMPLETED - 1 hour, documentation fix)
- [x] Issue #2: Worker Path Resolution (✅ COMPLETED - 1 hour, path fix + helper)
- [x] Issue #3: Useless AbortSignal (✅ COMPLETED - 2 hours, worker fix)
- [x] Issue #4: ImageData Copy Performance (✅ COMPLETED - 1-2 hours)
- [x] Issue #5: Worker Memory Leaks (✅ COMPLETED - ~1 hour, bridge + API + docs)
- [x] Issue #6: Lanczos3 vs Triangular (✅ COMPLETED - ~1 hour, type + worker + docs)
- [x] Issue #7: WASM Module Loading Fragility (✅ COMPLETED - ~1 hour, loader + worker updates + tests)
- [x] Issue #8: No Input Validation (✅ COMPLETED - ~2 hours, validators + integration + tests + docs)
- [x] Issue #9: Unsafe Type Casts (✅ COMPLETED - ~1 hour, buffer validator + bridge updates + tests)
- [x] Issue #10: Parameter Order Consistency (✅ COMPLETED - ~30 min, parameter order consistency across all layers)
- [x] Issue #11: WASM Binary Bundled (✅ COMPLETED - ~1 hour, main README + package READMEs + future roadmap)
- [x] Issue #12: Edge Cases in Resize Logic (✅ COMPLETED - ~1 hour, dimension calculation safety + comprehensive tests + docs)
- [x] Issue #13: Internal Exports (✅ COMPLETED - ~30 min, API surface cleanup)
- ...
```

---

## Release Checklist

After all issues resolved:

- [ ] All 13 issues marked complete
- [ ] Full test suite passing
- [ ] README examples verified
- [ ] TypeScript strict mode passing
- [ ] ESLint/Prettier clean
- [ ] No console.log in production code
- [ ] Package.json metadata complete
- [ ] Examples app builds and runs
- [ ] Manual testing in different environments
- [ ] Ready for npm publish

---

## Quick Links

- **Main Analysis**: `../../DEEP_ANALYSIS.md` (if available)
- **Project Guidelines**: `../../README.md`
- **Development Rules**: `../rules/project-rules.mdc`

---

## Questions?

Refer to the specific issue file for:
- Detailed problem descriptions
- Code examples
- Testing strategies
- Implementation guidance

Good luck! 🚀
