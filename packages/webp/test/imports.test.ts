import { test, expect } from 'bun:test';
import { encode, createWebpEncoder } from '../dist/index.js';
import type { WebpOptions } from '../dist/index';

test('@squoosh-lite/webp exports', () => {
  expect(encode).toBeDefined();
  expect(typeof encode).toBe('function');
  
  expect(createWebpEncoder).toBeDefined();
  expect(typeof createWebpEncoder).toBe('function');
});

test('@squoosh-lite/webp createWebpEncoder returns function', () => {
  const encoder = createWebpEncoder('client');
  expect(typeof encoder).toBe('function');
});
