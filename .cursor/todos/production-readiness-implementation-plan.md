# Production Readiness Implementation Plan

This document outlines the strategic improvements required to transition the `@squoosh-kit` monorepo from a Bun-centric library into a universal, production-grade package ecosystem compatible with Node.js, modern browsers, and Bun.

The plan is divided into three phases, addressing the build system, runtime robustness, and developer experience.

---

## Phase 1: Foundational Build System Overhaul

The primary goal of this phase is to reconfigure the build process to generate multiple artifacts, ensuring maximum compatibility with different JavaScript runtimes and module systems.

### Task 1.1: Implement Multi-Target Builds

Currently, all packages are built with `--target=bun`. We will expand this to support multiple environments.

- [x] **Objective:** Generate distinct builds optimized for Node.js, modern browsers, and Bun.
- [x] **Action Items:**
  - [x] Modify the `build` script in `packages/runtime/package.json`.
  - [x] Modify the `build` script in `packages/resize/package.json`.
  - [x] Modify the `build` script in `packages/webp/package.json`.
  - [x] Each script should run `bun build` three times, once for each target: `--target=node`, `--target=browser`, and `--target=bun`.
  - [x] Output files should be named clearly to distinguish their target (e.g., `index.node.js`, `index.browser.js`).

### Task 1.2: Generate Dual Module Formats (ESM & CJS)

To support both modern ESM-based projects and legacy CommonJS-based projects (common in the Node.js ecosystem), we will generate builds for both module systems.

- [x] **Objective:** Produce both ES Module (`.mjs`) and CommonJS (`.cjs`) artifacts for the `node` and `bun` targets.
- [x] **Action Items:**
  - [x] For the `node` and `bun` target builds, add a second build pass with `--format=cjs`.
  - [x] The output files should use appropriate extensions (e.g., `.mjs` for ESM and `.cjs` for CJS) to ensure correct module resolution by Node.js.

### Task 1.3: Reconfigure `package.json` `exports`

The `exports` field is the modern way to define a package's public API and support conditional resolution for different environments and module systems.

- [x] **Objective:** Update the `exports` map in each package's `package.json` to correctly point to the newly generated build artifacts.
- [x] **Action Items:**
  - [x] Modify `packages/runtime/package.json`.
  - [x] Modify `packages/resize/package.json`.
  - [x] Modify `packages/webp/package.json`.
  - [x] Implement a conditional exports structure similar to the following:

  ```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "bun": "./dist/index.bun.mjs",    // Bun-optimized ESM
      "import": "./dist/index.node.mjs", // Node ESM
      "require": "./dist/index.node.cjs" // Node CJS
    },
    "./worker": {
      "browser": "./dist/worker.browser.js" // Browser-specific worker
    }
  }
  ```

---

## Phase 2: Enhancing Robustness and Compatibility

This phase focuses on improving the runtime reliability of the library, particularly concerning asset loading and functional correctness.

### Task 2.1: Implement Environment-Aware Asset Loading

Loading WASM modules and Web Workers is highly environment-dependent. We will create an abstraction to handle this gracefully.

- [x] **Objective:** Centralize environment-specific asset loading logic within `@squoosh-kit/runtime`.
- [x] **Action Items:**
  - [x] In `@squoosh-kit/runtime`, create a new utility function, e.g., `createCodecWorker(workerPath: URL | string): Worker`.
  - [x] This function will use environment checks (`isBrowser`, `isNode`, `isBun`) to determine the correct way to instantiate a `Worker`.
  - [x] Refactor the `resize` and `webp` packages to use this new utility function instead of directly calling `new Worker()`.

### Task 2.2: Expand Test Suite with Integration Tests

The current test suite primarily validates API contracts. We need tests that verify the core functionality.

- [x] **Objective:** Add integration tests that confirm the WASM modules are producing correct outputs.
- [x] **Action Items:**
  - [x] In `packages/resize`, create a new test file for integration tests.
  - [x] The test should take a sample `ImageData` object, resize it, and assert that the output `ImageData` has the expected dimensions.
  - [x] In `packages/webp`, create a similar integration test that encodes a sample image and validates the output is a valid WebP file (e.g., by checking the file header or length).

---

## Phase 3: Dependency Management & Developer Experience

The final phase addresses dependency hygiene and improves the local development workflow.

### Task 3.1: Integrate Security Auditing

Incorporate automated security checks into the development and CI lifecycle.

- [x] **Objective:** Proactively identify and address vulnerabilities in third-party dependencies.
- [x] **Action Items:**
  - [x] In the root `package.json`, add `&& bun audit` to the `validate` script.
  - [x] Add a `bun audit` step to the CI workflow file (`.github/workflows/ci.yml`).

---

## Phase 4: Documentation and Developer Experience Enhancement

To be truly production-ready, a library must have excellent documentation and be easy for developers to contribute to and use.

### Task 4.1: Enhance Package READMEs

Each package should have a comprehensive README that serves as its primary documentation.

- [x] **Objective:** Provide clear, comprehensive, and easy-to-understand documentation for users of each package.
- [x] **Action Items:**
  - [x] Update the README for `@squoosh-kit/core`, `@squoosh-kit/resize`, `@squoosh-kit/webp`, and `@squoosh-kit/runtime`.
  - [x] For each README, add:
    - [x] **Installation Instructions:** `bun add @squoosh-kit/core`
    - [x] **API Documentation:** A detailed section for each exported function, including its signature, parameters, and return value.
    - [x] **Usage Examples:** Code snippets demonstrating usage in different environments (e.g., a simple Node.js script, a browser ESM import).
    - [x] **Badges:** Add badges for npm version, build status, license, etc., to the top of the file.

### Task 4.2: Create a `CONTRIBUTING.md` File

A contribution guide is essential for fostering an open and collaborative open-source project.

- [x] **Objective:** Create a clear guide for developers who want to contribute to the project.
- [x] **Action Items:**
  - [x] Create a `CONTRIBUTING.md` file in the root of the repository.
  - [x] Include sections on:
    - [x] How to set up the development environment.
    - [x] The process for running tests and validation scripts.
    - [x] Coding standards (linking to Prettier/ESLint configs).
    - [x] The pull request and code review process.

### Task 4.3: Set Up Automated Changelog Generation

A changelog is critical for communicating changes between versions to users.

- [x] **Objective:** Automate the creation and maintenance of a `CHANGELOG.md` file.
- [x] **Action Items:**
  - [x] Ensure the `semantic-release` configuration (e.g., in `.releaserc.json` or `package.json`) is set up with the `@semantic-release/changelog` plugin.
  - [x] Generate the initial changelog based on the existing commit history.

---

## Phase 5: Final Polish and Production Hardening

This final phase focuses on operational excellence and ensuring the library is robust in real-world scenarios.

### Task 5.1: Implement Robust Error Handling

The library should gracefully handle and report errors that occur within the WASM modules or worker threads.

- [x] **Objective:** Improve error propagation and provide meaningful error messages to users.
- [x] **Action Items:**
  - [x] Review the worker communication bridge in `@squoosh-kit/runtime`.
  - [x] Implement `try...catch` blocks around WASM function calls within the workers.
  - [x] When an error occurs, post it back to the main thread with a clear message and potentially an error code.
  - [x] Ensure the main thread's calling function rejects a Promise with a helpful `Error` object.

### Task 5.2: Add Bundle Size Analysis

To keep the library lightweight and performant, we must monitor its bundle size.

- [x] **Objective:** Prevent unintentional bundle size regressions.
- [x] **Action Items:**
  - [x] Add a new script to the root `package.json`, e.g., `size-check`.
  - [x] This script will run after the production build and check the file size of the key build artifacts (e.g., `index.browser.js`).
  - [x] Integrate this script into the CI pipeline to fail the build if the size increases beyond a certain threshold.

### Task 5.3: Verify CI/CD Release Workflow

Before relying on full automation, we must audit the entire release pipeline.

- [x] **Objective:** Ensure the automated release process is reliable and secure.
- [x] **Action Items:**
  - [x] Locate the GitHub Actions workflow file for releases (e.g., `.github/workflows/release.yml`).
  - [x] Verify that it correctly uses `NPM_TOKEN` and `GITHUB_TOKEN` secrets.
  - [x] Confirm that it is configured to run `semantic-release` on pushes to the main branch.
  - [x] Conduct a dry run of the release process if possible to validate the entire flow without publishing.
