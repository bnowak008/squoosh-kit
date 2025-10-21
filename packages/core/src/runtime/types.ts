/**
 * Shared types for Squoosh Lite packages
 */

export type BridgeMode = 'worker' | 'client';

export type ImageInput =
  | ImageData
  | { data: Uint8Array; width: number; height: number };
