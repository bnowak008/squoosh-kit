import { useEffect } from 'react';
import type { Dispatch } from 'react';
import type { Action } from '../types';
import { jxl } from '@squoosh-kit/core';

const BRIDGE_OPTIONS = { assetPath: '/squoosh-kit' };
const PERF_FLAG = 'perf';
let decodeWorker: Worker | null = null;
let decodeRequestId = 0;

type DecodeWorkerSuccess = {
  id: number;
  ok: true;
  width: number;
  height: number;
  sharedBuffer: SharedArrayBuffer;
};

type DecodeWorkerFailure = {
  id: number;
  ok: false;
  error: string;
};

type DecodeWorkerResponse = DecodeWorkerSuccess | DecodeWorkerFailure;

function isJxlFile(file: File): boolean {
  return file.type === 'image/jxl' || file.name.toLowerCase().endsWith('.jxl');
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

function getDecodeWorker(): Worker {
  if (!decodeWorker) {
    decodeWorker = new Worker(
      new URL('../workers/imageDecode.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }
  return decodeWorker;
}

if (typeof window !== 'undefined') {
  getDecodeWorker();
}

function decodeWithWorker(
  file: File,
  signal: AbortSignal
): Promise<{ width: number; height: number; data: Uint8ClampedArray }> {
  return new Promise((resolve, reject) => {
    const worker = getDecodeWorker();
    const id = ++decodeRequestId;

    const cleanup = () => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      worker.removeEventListener('messageerror', onMessageError);
      signal.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };

    const onMessage = (event: MessageEvent<DecodeWorkerResponse>) => {
      const response = event.data;
      if (!response || response.id !== id) return;
      cleanup();
      if (!response.ok) {
        reject(new Error(response.error));
        return;
      }
      resolve({
        width: response.width,
        height: response.height,
        data: new Uint8ClampedArray(response.sharedBuffer),
      });
    };

    const onError = (event: ErrorEvent) => {
      cleanup();
      reject(new Error(event.message || 'Decode worker failed.'));
    };

    const onMessageError = () => {
      cleanup();
      reject(new Error('Decode worker returned an unreadable response.'));
    };

    if (signal.aborted) {
      onAbort();
      return;
    }

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    worker.addEventListener('messageerror', onMessageError);
    signal.addEventListener('abort', onAbort);

    void file
      .arrayBuffer()
      .then((buffer) => {
        if (signal.aborted) {
          cleanup();
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        worker.postMessage(
          { id, buffer, mimeType: file.type },
          [buffer]
        );
      })
      .catch((error: unknown) => {
        cleanup();
        reject(error instanceof Error ? error : new Error(String(error)));
      });
  });
}

async function decodeJxlWithWorker(file: File): Promise<{
  width: number;
  height: number;
  data: Uint8ClampedArray;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const decoder = jxl.createJxlDecoder('worker', BRIDGE_OPTIONS);
  try {
    const decoded = await decoder(new Uint8Array(arrayBuffer));
    const data =
      decoded.data instanceof Uint8ClampedArray
        ? decoded.data
        : new Uint8ClampedArray(decoded.data);
    return { width: decoded.width, height: decoded.height, data };
  } finally {
    await decoder.terminate();
  }
}

export function useImageDecode(
  file: File | null,
  dispatch: Dispatch<Action>
): void {
  useEffect(() => {
    if (!file) return;

    let cancelled = false;
    let decodeController: AbortController | null = null;
    mark('squoosh.file_selected');

    const objectUrl = URL.createObjectURL(file);
    dispatch({ type: 'SET_FILE_URL', objectUrl });
    mark('squoosh.source_url_dispatched');

    async function decode(): Promise<void> {
      if (!file) return;

      try {
        mark('squoosh.decode_start');

        let result: { width: number; height: number; data: Uint8ClampedArray };
        if (isJxlFile(file)) {
          result = await decodeJxlWithWorker(file);
        } else {
          decodeController = new AbortController();
          mark('squoosh.decode_extract_start');
          result = await decodeWithWorker(file, decodeController.signal);
          mark('squoosh.decode_extract_end');
          measure(
            'squoosh.decode_extract_duration',
            'squoosh.decode_extract_start',
            'squoosh.decode_extract_end'
          );
        }

        if (!cancelled) {
          mark('squoosh.decode_end');
          measure('squoosh.decode_duration', 'squoosh.decode_start', 'squoosh.decode_end');
          dispatch({
            type: 'DECODE_SUCCESS',
            imageInput: { data: result.data, width: result.width, height: result.height },
          });
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          dispatch({ type: 'DECODE_ERROR', error: message });
        }
      }
    }

    void decode();

    return () => {
      cancelled = true;
      decodeController?.abort();
    };
  }, [file, dispatch]);
}
