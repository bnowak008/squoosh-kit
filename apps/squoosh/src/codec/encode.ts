import { webp, avif, mozjpeg, jxl, oxipng, png } from '@squoosh-kit/core';
import type { ImageInput, CodecId } from '../types';

const BRIDGE_OPTIONS = { assetPath: '/squoosh-kit' };

type EncoderWrapper = {
  encode: (
    image: ImageInput,
    options: Record<string, unknown>,
    signal: AbortSignal
  ) => Promise<Uint8Array>;
  terminate: () => Promise<void>;
};

const factories = new Map<CodecId, EncoderWrapper>();

function createEncoderWrapper(codecId: CodecId): EncoderWrapper {
  switch (codecId) {
    case 'webp': {
      const f = webp.createWebpEncoder('worker', BRIDGE_OPTIONS);
      return {
        encode: (image, options, signal) =>
          f(
            image,
            options as Parameters<typeof f>[1],
            signal
          ),
        terminate: () => f.terminate(),
      };
    }
    case 'avif': {
      const f = avif.createAvifEncoder('worker', BRIDGE_OPTIONS);
      return {
        encode: (image, options, signal) =>
          f(
            image,
            options as Parameters<typeof f>[1],
            signal
          ),
        terminate: () => f.terminate(),
      };
    }
    case 'mozjpeg': {
      const f = mozjpeg.createMozjpegEncoder('worker', BRIDGE_OPTIONS);
      return {
        encode: (image, options, signal) =>
          f(
            image,
            options as Parameters<typeof f>[1],
            signal
          ),
        terminate: () => f.terminate(),
      };
    }
    case 'jxl': {
      const f = jxl.createJxlEncoder('worker', BRIDGE_OPTIONS);
      return {
        encode: (image, options, signal) =>
          f(
            image,
            options as Parameters<typeof f>[1],
            signal
          ),
        terminate: () => f.terminate(),
      };
    }
    case 'oxipng': {
      const f = oxipng.createOxipngOptimizer('worker', BRIDGE_OPTIONS);
      return {
        encode: (image, options, signal) =>
          f(
            image,
            options as Parameters<typeof f>[1],
            signal
          ),
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

export async function encodeWith(
  codecId: CodecId,
  image: ImageInput,
  options: Record<string, unknown>,
  signal: AbortSignal
): Promise<Uint8Array> {
  let factory = factories.get(codecId);
  if (!factory) {
    factory = createEncoderWrapper(codecId);
    factories.set(codecId, factory);
  }
  return factory.encode(image, options, signal);
}

export async function terminateAll(): Promise<void> {
  const promises: Promise<void>[] = [];
  for (const factory of factories.values()) {
    promises.push(factory.terminate());
  }
  factories.clear();
  await Promise.all(promises);
}

export async function terminateCodec(codecId: CodecId): Promise<void> {
  const factory = factories.get(codecId);
  if (factory) {
    factories.delete(codecId);
    await factory.terminate();
  }
}
