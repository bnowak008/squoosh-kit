import { test, expect } from 'bun:test';
import { resize, createResizer } from '../dist/index.js';
import type { ResizeOptions } from '../dist/index';

test('@squoosh-lite/resize exports', () => {
  expect(resize).toBeDefined();
  expect(typeof resize).toBe('function');
  
  expect(createResizer).toBeDefined();
  expect(typeof createResizer).toBe('function');
});

test('@squoosh-lite/resize createResizer returns function', () => {
  const resizer = createResizer('client');
  expect(typeof resizer).toBe('function');
});
