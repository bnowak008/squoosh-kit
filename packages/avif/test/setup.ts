import { beforeAll } from 'bun:test';

beforeAll(async () => {
  // Copy WASM assets before running tests
  await import('../scripts/copy-assets.ts');
});
