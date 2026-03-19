import type { ImageInput } from '@squoosh-kit/core';
import type { ResizeOptions } from '@squoosh-kit/resize';

export type { ImageInput, ResizeOptions };

export type CodecId = 'webp' | 'avif' | 'mozjpeg' | 'jxl' | 'oxipng' | 'png';

export type AppPhase = 'landing' | 'decoding' | 'editor' | 'encoding';

export type EncodeResult = {
  bytes: Uint8Array;
  objectUrl: string;
  sizeBytes: number;
};

export type AppState = {
  phase: AppPhase;
  sourceFile: File | null;
  imageInput: ImageInput | null;
  sourceObjectUrl: string | null;
  codecId: CodecId;
  codecOptions: Record<string, unknown>;
  resizeEnabled: boolean;
  resizeOptions: ResizeOptions;
  encodeResult: EncodeResult | null;
  encodeError: string | null;
};

export type Action =
  | { type: 'SET_FILE'; file: File }
  | { type: 'DECODE_SUCCESS'; imageInput: ImageInput; objectUrl: string }
  | { type: 'DECODE_ERROR'; error: string }
  | { type: 'SET_CODEC'; codecId: CodecId; defaultOptions: Record<string, unknown> }
  | { type: 'SET_OPTIONS'; options: Record<string, unknown> }
  | { type: 'SET_RESIZE_ENABLED'; enabled: boolean }
  | { type: 'SET_RESIZE_OPTIONS'; options: ResizeOptions }
  | { type: 'ENCODE_START' }
  | { type: 'ENCODE_SUCCESS'; bytes: Uint8Array; objectUrl: string }
  | { type: 'ENCODE_ERROR'; error: string }
  | { type: 'RESET' };
