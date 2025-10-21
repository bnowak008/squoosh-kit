/**
 * Test setup for @squoosh-kit/core integration tests
 * @vitest-environment happy-dom
 */

import { beforeAll, afterAll } from 'bun:test';
import { webcrypto } from 'node:crypto';

// Polyfill for crypto.subtle and crypto.randomUUID
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}

beforeAll(() => {
  // Setup for integration tests
  console.log('Setting up @squoosh-kit/core integration tests...');
});

afterAll(() => {
  // Teardown for integration tests
  console.log('Tearing down @squoosh-kit/core integration tests...');
});
