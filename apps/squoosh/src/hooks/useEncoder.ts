import { useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import type { Action, ImageInput, CodecId, ResizeOptions } from '../types';
import { encodeWith, terminateAll } from '../codec/encode';
import { getCodec } from '../codec/registry';
import { resize } from '@squoosh-kit/core';

const BRIDGE_OPTIONS = { assetPath: '/squoosh-kit' };

let resizerFactory: ReturnType<typeof resize.createResizer> | null = null;

function getResizer() {
  if (!resizerFactory) {
    resizerFactory = resize.createResizer('worker', BRIDGE_OPTIONS);
  }
  return resizerFactory;
}

export function useEncoder(
  image: ImageInput | null,
  codecId: CodecId,
  options: Record<string, unknown>,
  resizeEnabled: boolean,
  resizeOptions: ResizeOptions,
  dispatch: Dispatch<Action>
): void {
  useEffect(() => {
    if (!image) return;

    dispatch({ type: 'ENCODE_START' });

    const controller = new AbortController();
    let timerId: ReturnType<typeof setTimeout>;

    timerId = setTimeout(() => {
      (async () => {
        let imageToEncode = image;

        if (resizeEnabled && resizeOptions.width && resizeOptions.height) {
          imageToEncode = await getResizer()(imageToEncode, resizeOptions, controller.signal);
        }

        if (controller.signal.aborted) return;

        const bytes = await encodeWith(codecId, imageToEncode, options, controller.signal);

        if (controller.signal.aborted) return;

        const codec = getCodec(codecId);
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: codec.mimeType });
        const objectUrl = URL.createObjectURL(blob);
        dispatch({ type: 'ENCODE_SUCCESS', bytes, objectUrl });
      })().catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : String(err);
        dispatch({ type: 'ENCODE_ERROR', error: message });
      });
    }, 400);

    return () => {
      clearTimeout(timerId);
      controller.abort();
    };
  }, [image, codecId, options, resizeEnabled, resizeOptions, dispatch]);

  useEffect(() => {
    return () => {
      void terminateAll();
      resizerFactory?.terminate();
      resizerFactory = null;
    };
  }, []);
}
