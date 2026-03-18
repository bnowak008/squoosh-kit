# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
bun install

# Build all packages (order matters: runtime → webp,resize → core → vite-plugin)
bun run build

# Build a specific package
cd packages/runtime && bun run build

# Run all tests
bun test

# Run tests in a specific package
cd packages/webp && bun test

# Run a single test file
bun test packages/webp/test/webp.test.ts

# Type checking
bun run check-types

# Lint
bun run lint
bun run lint:fix

# Format
bun run format
bun run format:check

# Run all checks (types → lint → format → test)
bun run validate

# Sync Squoosh codec WASM files from official repo
bun run sync-codecs

# Clean all build artifacts
bun run clean
```

## Architecture

Squoosh Kit is a Bun-first monorepo providing thin TypeScript wrappers around Google Squoosh's WASM image codecs (WebP encoding, image resizing). The WASM binaries are sourced directly from the official Squoosh repo without modification via `sync-codecs`.

### Package Structure

- **`@squoosh-kit/runtime`** — Foundation: environment detection (Bun/Node/browser), WASM loading, Worker RPC bridge (`callWorker`), SIMD detection, input validators. All other packages depend on this.
- **`@squoosh-kit/webp`** — WebP encoding. Exports `encode()` (one-shot) and `createWebpEncoder()` (reusable factory).
- **`@squoosh-kit/resize`** — Image resizing with 4 algorithms. Exports `resize()` and `createResizer()`.
- **`@squoosh-kit/core`** — Meta-package that re-exports everything from webp and resize.
- **`@squoosh-kit/vite-plugin`** — Vite plugin that auto-copies `.browser.mjs`/WASM assets, sets CORS headers (`require-corp`, `same-origin`), and serves files under `/squoosh-kit/`.

### Worker/Client Bridge Pattern

Each codec package (`webp`, `resize`) uses a bridge pattern with two modes:

- **Worker mode** (default): Offloads WASM processing to a Web Worker via RPC. The global singleton worker is reused across calls. Call `.terminate()` to clean up.
- **Client mode**: Runs WASM directly on the calling thread.

The bridge is created in `bridge.ts` per package, the worker entry point is `*.worker.ts`, and RPC is implemented in `runtime/src/worker-call.ts`.

### Multi-Target Builds

Each package builds 4 output targets using `Bun.build()` in the package's `build.ts`:

1. `index.bun.mjs` — Bun runtime
2. `index.node.mjs` — Node ESM
3. `index.node.cjs` — Node CJS
4. `index.browser.mjs` — Browser ESM

TypeScript declarations are generated separately via `tsc`. The `package.json` `exports` field maps runtime environments to the correct file.

Worker files have their own export condition: `"./webp.worker.js"` / `"./resize.worker.js"`.

### Path Aliases

`@squoosh-kit/*` resolves to `packages/*/src` during development (configured in `tsconfig.base.json`).

### Key Conventions

- Use **functions over classes**, **types over interfaces**
- **No `any`** — strict TypeScript throughout
- **Bun** is the package manager and runtime (`bun install`, `bun test`, `bun run`)
- **AbortSignal** is the cancellation mechanism for async operations
- All public APIs validate inputs before passing to WASM (see `validators.ts` per package)
- Bundle size limits enforced via `.size-limit.json` (5 KB runtime, 10 KB webp/resize, 15 KB core)
