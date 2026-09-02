/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from 'bun:test';
import { resolveServerWorkerScript } from '../src/worker-helper.js';
import { validateArrayBuffer } from '../src/validators.js';

function scriptUrlToPath(scriptUrl: string | URL): string {
  const href = typeof scriptUrl === 'string' ? scriptUrl : scriptUrl.href;
  if (href.startsWith('file://')) {
    return decodeURIComponent(
      href.startsWith('file:///') ? href.slice(7) : href.slice(5)
    );
  }
  return href;
}

describe('Worker script resolution', () => {
  it('resolves webp worker to an existing script', () => {
    const script = resolveServerWorkerScript(
      {
        package: '@squoosh-kit/webp',
        specifier: 'webp.worker.js',
      },
      'webp.worker.js'
    );

    const path = scriptUrlToPath(script);

    expect(path).toContain('webp.worker');
    expect(
      Bun.spawnSync(['test', '-f', path], { stdout: 'ignore' }).exitCode
    ).toBe(0);
  });

  it('prefers built worker output when dist is available', () => {
    const distPath = new URL(
      '../../webp/dist/webp.worker.bun.js',
      import.meta.url
    );
    const distExists =
      Bun.spawnSync(['test', '-f', scriptUrlToPath(distPath)], {
        stdout: 'ignore',
      }).exitCode === 0;

    if (!distExists) {
      return;
    }

    const script = resolveServerWorkerScript(
      {
        package: '@squoosh-kit/webp',
        specifier: 'webp.worker.js',
      },
      'webp.worker.js'
    );

    const path = scriptUrlToPath(script);
    expect(path).not.toContain('/src/webp.worker.ts');
    expect(path).toContain('/dist/');
  });
});

describe('Buffer Validation', () => {
  it('should accept normal ArrayBuffer', () => {
    const buffer = new ArrayBuffer(100);
    expect(() => validateArrayBuffer(buffer)).not.toThrow();
  });

  it('should accept Uint8Array backed by ArrayBuffer', () => {
    const arrayBuffer = new ArrayBuffer(100);
    const uint8Array = new Uint8Array(arrayBuffer);
    expect(() => validateArrayBuffer(uint8Array.buffer)).not.toThrow();
  });

  it('should reject SharedArrayBuffer', () => {
    if (typeof SharedArrayBuffer !== 'undefined') {
      const sharedBuffer = new SharedArrayBuffer(100);
      expect(() => validateArrayBuffer(sharedBuffer)).toThrow(
        /SharedArrayBuffer/
      );
    }
  });

  it('should reject null', () => {
    expect(() => validateArrayBuffer(null)).toThrow(/ArrayBuffer/);
  });

  it('should reject undefined', () => {
    expect(() => validateArrayBuffer(undefined)).toThrow(/ArrayBuffer/);
  });

  it('should reject plain objects', () => {
    expect(() => validateArrayBuffer({})).toThrow(/ArrayBuffer/);
  });

  it('should reject strings', () => {
    expect(() => validateArrayBuffer('buffer')).toThrow(/ArrayBuffer/);
  });

  it('should reject numbers', () => {
    expect(() => validateArrayBuffer(123)).toThrow(/ArrayBuffer/);
  });
});
