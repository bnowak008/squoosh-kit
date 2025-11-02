/**
 * @squoosh-kit/jxl public API
 */
import type { ImageInput } from '@squoosh-kit/runtime';
import { createBridge } from './bridge';
import type { JxlEncodeInputOptions } from './types';

export type { ImageInput, JxlEncodeInputOptions };

let globalBridge: ReturnType<typeof createBridge> | null = null;

export type JxlEncoderFactory = ((
  imageData: ImageInput,
  options?: JxlEncodeInputOptions,
  signal?: AbortSignal
) => Promise<Uint8Array>) & {
  terminate(): Promise<void>;
};

export type JxlDecoderFactory = ((
  buffer: BufferSource,
  signal?: AbortSignal
) => Promise<ImageData>) & {
  terminate(): Promise<void>;
};

export async function encode(
  imageData: ImageInput,
  options?: JxlEncodeInputOptions,
  signal?: AbortSignal
): Promise<Uint8Array> {
  if (!globalBridge) globalBridge = createBridge('worker');
  return globalBridge.encode(imageData, options, signal);
}

export async function decode(
  buffer: BufferSource,
  signal?: AbortSignal
): Promise<ImageData> {
  if (!globalBridge) globalBridge = createBridge('worker');
  return globalBridge.decode(buffer, signal);
}

export function createJxlEncoder(
  mode: 'worker' | 'client' = 'worker'
): JxlEncoderFactory {
  const bridge = createBridge(mode);
  return Object.assign(
    (
      imageData: ImageInput,
      options?: JxlEncodeInputOptions,
      signal?: AbortSignal
    ) => bridge.encode(imageData, options, signal),
    { terminate: () => bridge.terminate() }
  );
}

export function createJxlDecoder(
  mode: 'worker' | 'client' = 'worker'
): JxlDecoderFactory {
  const bridge = createBridge(mode);
  return Object.assign(
    (buffer: BufferSource, signal?: AbortSignal) =>
      bridge.decode(buffer, signal),
    { terminate: () => bridge.terminate() }
  );
}
