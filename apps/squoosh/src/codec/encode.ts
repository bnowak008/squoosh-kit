import { webp, avif, mozjpeg, jxl, oxipng, png } from '@squoosh-kit/core';
import type { ImageInput } from '@squoosh-kit/core';
import type { CodecId } from '../types';
import { getCodec } from './registry';

const BRIDGE_OPTIONS = { assetPath: '/squoosh-kit' };
const PERF_FLAG = 'perf';
const TINY_IMAGE: ImageInput = {
  data: new Uint8ClampedArray([0, 0, 0, 255]),
  width: 1,
  height: 1,
};

type EncoderWrapper = {
  encode: (
    image: ImageInput,
    options: Record<string, unknown>,
    signal: AbortSignal
  ) => Promise<Uint8Array>;
  terminate: () => Promise<void>;
};

const factories = new Map<CodecId, EncoderWrapper>();
const warmupPromises = new Map<CodecId, Promise<void>>();
const warmedCodecs = new Set<CodecId>();

function isPerfEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has(PERF_FLAG);
}

function logPerf(message: string): void {
  if (!isPerfEnabled()) return;
  console.info(`[perf] ${message}`);
}

function getEncoder(codecId: CodecId): EncoderWrapper {
  let factory = factories.get(codecId);
  if (!factory) {
    factory = createEncoderWrapper(codecId);
    factories.set(codecId, factory);
  }
  return factory;
}

function createEncoderWrapper(codecId: CodecId): EncoderWrapper {
  switch (codecId) {
    case 'webp': {
      const f = webp.createWebpEncoder('worker', BRIDGE_OPTIONS);
      return {
        encode: (image, options, signal) =>
          f(image, options as Parameters<typeof f>[1], signal),
        terminate: () => f.terminate(),
      };
    }
    case 'avif': {
      const f = avif.createAvifEncoder('worker', BRIDGE_OPTIONS);
      return {
        encode: (image, options, signal) =>
          f(image, options as Parameters<typeof f>[1], signal),
        terminate: () => f.terminate(),
      };
    }
    case 'mozjpeg': {
      const f = mozjpeg.createMozjpegEncoder('worker', BRIDGE_OPTIONS);
      return {
        encode: (image, options, signal) =>
          f(image, options as Parameters<typeof f>[1], signal),
        terminate: () => f.terminate(),
      };
    }
    case 'jxl': {
      const f = jxl.createJxlEncoder('worker', BRIDGE_OPTIONS);
      return {
        encode: (image, options, signal) =>
          f(image, options as Parameters<typeof f>[1], signal),
        terminate: () => f.terminate(),
      };
    }
    case 'oxipng': {
      const f = oxipng.createOxipngOptimizer('worker', BRIDGE_OPTIONS);
      return {
        encode: (image, options, signal) =>
          f(image, options as Parameters<typeof f>[1], signal),
        terminate: () => f.terminate(),
      };
    }
    case 'png': {
      const f = png.createPngEncoder('worker', BRIDGE_OPTIONS);
      return {
        encode: (image, _options, signal) => f(image, signal),
        terminate: () => f.terminate(),
      };
    }
  }
}

export function prewarmCodec(codecId: CodecId): void {
  if (warmedCodecs.has(codecId)) return;
  const inFlight = warmupPromises.get(codecId);
  if (inFlight) return;

  const warmup = (async () => {
    const encoder = getEncoder(codecId);
    const controller = new AbortController();
    const started = typeof performance !== 'undefined' ? performance.now() : 0;
    try {
      await encoder.encode(
        TINY_IMAGE,
        getCodec(codecId).defaultOptions,
        controller.signal
      );
      warmedCodecs.add(codecId);
      if (typeof performance !== 'undefined') {
        const duration = performance.now() - started;
        logPerf(`squoosh.warmup_${codecId}: ${duration.toFixed(2)}ms`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logPerf(`squoosh.warmup_${codecId}_error: ${message}`);
    } finally {
      warmupPromises.delete(codecId);
    }
  })();

  warmupPromises.set(codecId, warmup);
}

export function getCodecWarmupState(
  codecId: CodecId
): 'warm' | 'warming' | 'cold' {
  if (warmedCodecs.has(codecId)) return 'warm';
  if (warmupPromises.has(codecId)) return 'warming';
  return 'cold';
}

export async function encodeWith(
  codecId: CodecId,
  image: ImageInput,
  options: Record<string, unknown>,
  signal: AbortSignal
): Promise<Uint8Array> {
  const factory = getEncoder(codecId);
  return factory.encode(image, options, signal);
}

export async function terminateAll(): Promise<void> {
  const promises: Promise<void>[] = [];
  for (const factory of factories.values()) {
    promises.push(factory.terminate());
  }
  factories.clear();
  warmupPromises.clear();
  warmedCodecs.clear();
  await Promise.all(promises);
}

export async function terminateCodec(codecId: CodecId): Promise<void> {
  const factory = factories.get(codecId);
  if (factory) {
    factories.delete(codecId);
    warmupPromises.delete(codecId);
    warmedCodecs.delete(codecId);
    await factory.terminate();
  }
}
