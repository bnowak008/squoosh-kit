import type { CodecId } from '../types';

export type CodecEntry = {
  id: CodecId;
  label: string;
  mimeType: string;
  ext: string;
  defaultOptions: Record<string, unknown>;
  browserPreview: boolean;
};

export const CODECS: CodecEntry[] = [
  {
    id: 'webp',
    label: 'WebP',
    mimeType: 'image/webp',
    ext: '.webp',
    defaultOptions: { quality: 75, lossless: 0, method: 4 },
    browserPreview: true,
  },
  {
    id: 'avif',
    label: 'AVIF',
    mimeType: 'image/avif',
    ext: '.avif',
    defaultOptions: { quality: 60, qualityAlpha: -1, speed: 6, subsample: 1.5 },
    browserPreview: true,
  },
  {
    id: 'mozjpeg',
    label: 'MozJPEG',
    mimeType: 'image/jpeg',
    ext: '.jpg',
    defaultOptions: { quality: 75, progressive: true },
    browserPreview: true,
  },
  {
    id: 'jxl',
    label: 'JPEG XL',
    mimeType: 'image/jxl',
    ext: '.jxl',
    defaultOptions: { quality: 75, effort: 7 },
    browserPreview: false,
  },
  {
    id: 'oxipng',
    label: 'OxiPNG',
    mimeType: 'image/png',
    ext: '.png',
    defaultOptions: { level: 2, interlace: false },
    browserPreview: true,
  },
  {
    id: 'png',
    label: 'PNG (lossless)',
    mimeType: 'image/png',
    ext: '.png',
    defaultOptions: {},
    browserPreview: true,
  },
];

export function getCodec(id: CodecId): CodecEntry {
  const codec = CODECS.find((c) => c.id === id);
  if (!codec) throw new Error(`Unknown codec: ${id}`);
  return codec;
}
