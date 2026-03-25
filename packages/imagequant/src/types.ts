import type { QuantizerModule } from '../wasm/imagequant/imagequant';

export interface ImagequantOptions {
  numColors?: number; // 2-256, default 256
  dither?: number; // 0-1, default 1.0
  zx?: boolean; // use zx_quantize (auto colors), default false
}

export type { QuantizerModule };
