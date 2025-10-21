# @squoosh-kit Monorepo Migration Plan

This document outlines the phased plan to refactor the `squoosh-kit` project into a production-ready monorepo, enabling the publication of modular packages to npm.

---

## Phase 1: Establish the Monorepo Foundation

**Goal:** Configure the project as a formal Bun workspace and create the new package structures.

- [x] **Configure Bun Workspace:**
  - [x] Modify the root `package.json` to define a `workspaces` array (e.g., `"workspaces": ["packages/*"]`).
  - [x] Move all `devDependencies` (`typescript`, `eslint`, `prettier`, etc.) from `packages/core/package.json` to the root `package.json` to ensure a single version of tooling.

- [x] **Create New Package Scaffolding:**
  - [x] Create `packages/runtime/package.json`.
  - [x] Create `packages/webp/package.json`.
  - [x] Create `packages/resize/package.json`.
  - [x] Each new `package.json` should be configured with its name (`@squoosh-kit/runtime`), version, and initial scripts.

- [x] **Relocate Source Code:**
  - [x] Move `packages/core/src/runtime` to `packages/runtime/src`.
  - [x] Move `packages/core/src/features/webp` to `packages/webp/src`.
  - [x] Move `packages/core/src/features/resize` to `packages/resize/src`.
  - [x] Update all internal import paths to use the new package names (e.g., `import { ... } from '@squoosh-kit/runtime';`).

- [x] **Define Package Dependencies:**
  - [x] In `packages/webp/package.json`, add a dependency on `@squoosh-kit/runtime`.
  - [x] In `packages/resize/package.json`, add a dependency on `@squoosh-kit/runtime`.
  - [x] In `packages/core/package.json`, add dependencies on `@squoosh-kit/webp` and `@squoosh-kit/resize`.

---

## Phase 2: Decentralize the Build System & Asset Handling

**Goal:** Adapt the build and asset management processes to the new, modular structure using the "One Clone, Many Copies" strategy.

- [x] **Centralize Codec Fetching:**
  - [x] Create a root-level script: `scripts/sync-squoosh-codecs.ts`.
  - [x] This script's only responsibility is to clone/pull the Squoosh repo into a root-level `.squoosh-temp` directory.
  - [x] Add a corresponding `sync-codecs` script to the root `package.json`.

- [x] **Decentralize Asset Copying:**
  - [x] Create `packages/webp/scripts/copy-assets.ts` to copy only WebP-related files from `../../.squoosh-temp` into `packages/webp/dist/wasm`.
  - [x] Create `packages/resize/scripts/copy-assets.ts` to copy only resize-related files from `../../.squoosh-temp` into `packages/resize/dist/wasm`.

- [x] **Implement Per-Package Builds:**
  - [x] Add a `build` script to each package's `package.json` that handles its own asset copying and TypeScript compilation.
  - [x] Create a root-level `build` script in the root `package.json` that orchestrates running the `build` script in each package in the correct dependency order.

- [x] **Reconfigure `@squoosh-kit/core` Meta-Package:**
  - [x] Remove the `src` and `scripts` directories from `packages/core`.
  - [x] Simplify its `package.json` to only re-export functionality from the other packages. It will have no source code of its own.

---

## Phase 3: Tooling, Configuration, and Testing

**Goal:** Centralize configuration to ensure consistency and adapt the testing strategy to the monorepo structure.

- [x] **Shared TypeScript Configuration:**
  - [x] Create a `tsconfig.base.json` at the project root.
  - [x] Update the `tsconfig.json` in each package to `extend` the base configuration.

- [x] **Centralize Linting and Formatting:**
  - [x] Ensure `eslint` and `prettier` configurations reside at the root.
  - [x] Update the root `lint` and `format` scripts to run across all packages (e.g., `eslint .` and `prettier --write .`).

- [x] **Adapt Testing Strategy:**
  - [x] Move test files from `packages/core/test` into the corresponding new packages (`packages/webp/test`, `packages/resize/test`).
  - [x] Create a root-level `test` script that runs the tests for all packages.

---

## Phase 4: Documentation and Publishing Readiness

**Goal:** Update all documentation to reflect the new structure and prepare each package for individual publishing.

- [x] **Update Documentation:**
  - [x] Create a `README.md` for each new package with specific installation and usage instructions.
  - [x] Update the root `README.md` to explain the monorepo structure, the available packages, and contribution guidelines.

- [x] **Final Publishing Polish:**
  - [x] Add a `prepack` script to each package's `package.json` to ensure it's built before publishing.
  - [x] Verify the `files` array in each `package.json` to include all necessary build artifacts (e.g., `dist/**`).
  - [x] Ensure each package has a complete set of metadata (`author`, `license`, `repository`, etc.).
