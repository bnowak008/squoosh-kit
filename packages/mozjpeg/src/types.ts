import type {
  EncodeOptions,
  MozJpegColorSpace,
  MozJPEGModule,
} from '../wasm/mozjpeg/mozjpeg_enc';

type MozjpegEncodeInputOptions = Partial<EncodeOptions>;

export type {
  EncodeOptions,
  MozJpegColorSpace,
  MozJPEGModule,
  MozjpegEncodeInputOptions,
};
