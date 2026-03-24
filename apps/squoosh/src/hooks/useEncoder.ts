import { useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import type { Action, ImageInput, CodecId, ResizeOptions } from '../types';
import { encodeWith, getCodecWarmupState, terminateAll } from '../codec/encode';
import { getCodec } from '../codec/registry';
import { resize } from '@squoosh-kit/core';

const BRIDGE_OPTIONS = { assetPath: '/squoosh-kit' };
const PERF_FLAG = 'perf';

let resizerFactory: ReturnType<typeof resize.createResizer> | null = null;

function getResizer() {
  if (!resizerFactory) {
    resizerFactory = resize.createResizer('worker', BRIDGE_OPTIONS);
  }
  return resizerFactory;
}

function isPerfEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has(PERF_FLAG);
}

function mark(name: string): void {
  if (typeof performance === 'undefined') return;
  performance.mark(name);
}

function measure(name: string, start: string, end: string): void {
  if (typeof performance === 'undefined') return;
  try {
    performance.measure(name, start, end);
    if (!isPerfEnabled()) return;
    const entries = performance.getEntriesByName(name);
    const latest = entries[entries.length - 1];
    if (latest) console.info(`[perf] ${name}: ${latest.duration.toFixed(2)}ms`);
  } catch {
    return;
  }
}

export function useEncoder(
  image: ImageInput | null,
  codecId: CodecId,
  options: Record<string, unknown>,
  resizeEnabled: boolean,
  resizeOptions: ResizeOptions,
  dispatch: Dispatch<Action>
): void {
  const encodeJobRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      getResizer();
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!image) return;

    const jobId = ++encodeJobRef.current;
    dispatch({ type: 'ENCODE_START' });

    const controller = new AbortController();
    if (isPerfEnabled()) {
      console.info(
        `[perf] squoosh.encode_warmup_state.${codecId}: ${getCodecWarmupState(codecId)}`
      );
      console.info(`[perf] squoosh.encode_job_${jobId}: start`);
    }
    mark('squoosh.encode_start');

    (async () => {
      let imageToEncode = image;

      if (resizeEnabled && resizeOptions.width && resizeOptions.height) {
        mark('squoosh.resize_start');
        imageToEncode = await getResizer()(imageToEncode, resizeOptions, controller.signal);
        mark('squoosh.resize_end');
        measure('squoosh.resize_duration', 'squoosh.resize_start', 'squoosh.resize_end');
      }

      if (controller.signal.aborted) return;

      const bytes = await encodeWith(codecId, imageToEncode, options, controller.signal);

      if (controller.signal.aborted) return;

      const codec = getCodec(codecId);
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: codec.mimeType });
      const objectUrl = URL.createObjectURL(blob);
      mark('squoosh.encode_end');
      measure('squoosh.encode_duration', 'squoosh.encode_start', 'squoosh.encode_end');
      mark('squoosh.right_pane_url_set');
      dispatch({ type: 'ENCODE_SUCCESS', bytes, objectUrl });
      if (isPerfEnabled()) {
        console.info(`[perf] squoosh.encode_job_${jobId}: success`);
      }
    })().catch((err: unknown) => {
      if (controller.signal.aborted) {
        if (isPerfEnabled()) {
          console.info(`[perf] squoosh.encode_job_${jobId}: aborted`);
        }
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      if (isPerfEnabled()) {
        console.info(`[perf] squoosh.encode_job_${jobId}: error (${message})`);
      }
      dispatch({ type: 'ENCODE_ERROR', error: message });
    });

    return () => {
      if (isPerfEnabled()) {
        console.info(`[perf] squoosh.encode_job_${jobId}: cleanup_abort`);
      }
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
