import type {
  EncodeOptions,
  MozJPEGModule,
} from '../wasm/mozjpeg-enc/mozjpeg_enc';

type MozjpegEncodeOptions = Partial<EncodeOptions>;

export interface MozJPEGDecModule extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData | null;
}

export type { EncodeOptions, MozJPEGModule, MozjpegEncodeOptions };
