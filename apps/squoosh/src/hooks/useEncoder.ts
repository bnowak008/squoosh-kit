import { useEffect } from 'react';
import type { Dispatch } from 'react';
import type { Action, ImageInput, CodecId } from '../types';
import { encodeWith, terminateAll } from '../codec/encode';
import { getCodec } from '../codec/registry';

export function useEncoder(
  image: ImageInput | null,
  codecId: CodecId,
  options: Record<string, unknown>,
  dispatch: Dispatch<Action>
): void {
  useEffect(() => {
    if (!image) return;

    dispatch({ type: 'ENCODE_START' });

    const controller = new AbortController();
    let timerId: ReturnType<typeof setTimeout>;

    timerId = setTimeout(() => {
      encodeWith(codecId, image, options, controller.signal)
        .then((bytes) => {
          if (controller.signal.aborted) return;
          const codec = getCodec(codecId);
          const blob = new Blob([bytes.buffer as ArrayBuffer], { type: codec.mimeType });
          const objectUrl = URL.createObjectURL(blob);
          dispatch({ type: 'ENCODE_SUCCESS', bytes, objectUrl });
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          const message = err instanceof Error ? err.message : String(err);
          dispatch({ type: 'ENCODE_ERROR', error: message });
        });
    }, 400);

    return () => {
      clearTimeout(timerId);
      controller.abort();
    };
  }, [image, codecId, options, dispatch]);

  // Clean up all encoder factories on unmount
  useEffect(() => {
    return () => {
      void terminateAll();
    };
  }, []);
}
