# @squoosh-kit Production Readiness Audit (Post-Monorepo)

This document provides an updated analysis of the `@squoosh-kit` project, taking into account the recent migration to a monorepo architecture. It outlines the final steps required to make the packages 100% production-ready for publishing.

---

## 1. Executive Summary

The project has made substantial progress since the initial production-readiness analysis. The migration to a Bun-based monorepo is a major architectural improvement that has resolved many previous issues, including centralized tooling and the generation of TypeScript declaration files. The project is now approximately 90% of the way to being production-ready.

This audit focuses on the final 10%: refining package configurations, hardening asset-loading logic, and ensuring documentation is complete and consistent across the new package ecosystem.

**Key Recommendations:**

1.  **Standardize `package.json` configurations:** Ensure all packages have a consistent and modern configuration, particularly the `exports` map.
2.  **Harden WASM Asset Loading:** Remove the fragile environment-sniffing logic for loading WASM assets in workers.
3.  **Polish Code and Remove Artifacts:** Remove debugging `console.log` statements from library code.
4.  **Complete Package Documentation:** Ensure each package has a comprehensive `README.md` with specific usage instructions.

---

## 2. Package Configuration (`package.json`)

While the monorepo setup is excellent, the individual `package.json` files have some inconsistencies that should be resolved before publishing.

#### 2.1. Missing `exports` Field

The `@squoosh-kit/runtime` package is missing an `exports` field in its `package.json`. This can lead to inconsistent module resolution by different tools.

**Recommendation:**
Add a standard `exports` map to `packages/runtime/package.json`. This will also make the non-standard `entry` field obsolete.

```json
// In packages/runtime/package.json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  }
},
```

#### 2.2. Inconsistent Build & Lifecycle Scripts

There are minor inconsistencies in the build and lifecycle scripts across the packages.

- The `@squoosh-kit/core` package contains legacy build scripts (`build:declarations`, `build:code`) from the pre-monorepo era. It also has a `copy:assets` script, which contradicts the monorepo goal of `core` having no source of its own.
- The `prepublishOnly` script in `@squoosh-kit/core` runs tests, while the `prepack` scripts in other packages do not.

**Recommendation:**

1.  Simplify the `build` script in `packages/core/package.json` to be a simple re-exporting mechanism, removing the asset and complex build steps. Its build should likely just be `tsc`.
2.  Standardize the `prepack` script across all publishable packages. Including `bun test` is a good practice to prevent publishing failing versions.

#### 2.3. Cleanup of Non-Standard Fields

The `entry` field is present in several `package.json` files. This is not a standard field recognized by most tools. With a proper `exports` map, it is redundant.

**Recommendation:**
Remove the `"entry": "src/index.ts"` line from all `package.json` files.

---

## 3. Build System & Asset Handling

The decentralized build system is working well, but the way WASM assets are located at runtime is fragile.

#### 3.1. Fragile WASM Path Logic

In `packages/webp/src/webp.worker.ts` (and likely others), the path to the WASM file is determined by sniffing the URL:

```typescript
const isTest = import.meta.url.endsWith('.ts');
const wasmDirectory = isTest ? '../dist/wasm/webp' : './wasm/webp';
```

This is not robust. It assumes that tests are always run from `.ts` files and production code from `.js` files, which may not hold true in all environments (e.g., with different bundlers or test runners). For a library, predicting the final deployed structure is risky.

**Recommendation:**
Implement a more robust asset location strategy. A common pattern for libraries is to expect the WASM files to be in a predictable location relative to the worker script in the final `dist` directory. The logic should be simplified to look for the WASM file in a path relative to the final output file, such as `./wasm/webp/webp_enc.js`. The current logic already does this for the "production" case, so the test-specific logic should be removed in favor of ensuring the test environment correctly places assets in the `dist` folder before running tests.

---

## 4. Code Quality & Best Practices

The code quality is high, but some development artifacts remain.

#### 4.1. Debugging Logs in Source Code

The worker files, such as `packages/webp/src/webp.worker.ts`, contain `console.log` statements (e.g., `'🔧 WebP worker: Message handler registered'`). These are useful for debugging but should not be present in production library code.

**Recommendation:**
Remove all `console.log` statements from the library source code before publishing.

---

## 5. Documentation

With the move to a multi-package structure, documentation becomes even more critical.

#### 5.1. Per-Package README Files

Each package (`runtime`, `webp`, `resize`, `core`) has its own `README.md`. This is excellent.

**Recommendation:**
Before the first publish, perform a thorough review of each `README.md` to ensure it contains:

- The specific package name for installation (e.g., `bun add @squoosh-kit/webp`).
- A clear API reference for the functions exported by _that specific package_.
- A concise, copy-pasteable usage example.

#### 5.2. TSDoc Review

The project uses TSDoc comments, which is a best practice.

**Recommendation:**
Ensure all public, exported functions, types, and constants across all packages have complete TSDoc comments. This enables auto-generated API documentation and improves the developer experience in IDEs.
