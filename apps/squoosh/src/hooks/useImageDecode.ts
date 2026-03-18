import { useEffect } from 'react';
import type { Dispatch } from 'react';
import type { Action } from '../types';
import { jxl } from '@squoosh-kit/core';

const BRIDGE_OPTIONS = { assetPath: '/squoosh-kit' };

export function useImageDecode(
  file: File | null,
  dispatch: Dispatch<Action>
): void {
  useEffect(() => {
    if (!file) return;

    let cancelled = false;
    let createdObjectUrl: string | null = null;

    async function decode(): Promise<void> {
      if (!file) return;

      const objectUrl = URL.createObjectURL(file);
      createdObjectUrl = objectUrl;

      try {
        let width: number;
        let height: number;
        let data: Uint8ClampedArray;

        try {
          const bitmap = await createImageBitmap(file);
          width = bitmap.width;
          height = bitmap.height;
          const canvas = new OffscreenCanvas(width, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get 2d context');
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close();
          const imgData = ctx.getImageData(0, 0, width, height);
          data = imgData.data;
        } catch {
          // JXL fallback: use codec decoder
          const arrayBuffer = await file.arrayBuffer();
          const decoder = jxl.createJxlDecoder('worker', BRIDGE_OPTIONS);
          try {
            const decoded = await decoder(new Uint8Array(arrayBuffer));
            width = decoded.width;
            height = decoded.height;
            data = decoded.data instanceof Uint8ClampedArray
              ? decoded.data
              : new Uint8ClampedArray(decoded.data);
          } finally {
            await decoder.terminate();
          }
        }

        if (!cancelled) {
          createdObjectUrl = null; // ownership transferred to state
          dispatch({
            type: 'DECODE_SUCCESS',
            imageInput: { data, width, height },
            objectUrl,
          });
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (err) {
        if (createdObjectUrl) {
          URL.revokeObjectURL(createdObjectUrl);
          createdObjectUrl = null;
        }
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          dispatch({ type: 'DECODE_ERROR', error: message });
        }
      }
    }

    void decode();

    return () => {
      cancelled = true;
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
        createdObjectUrl = null;
      }
    };
  }, [file, dispatch]);
}
