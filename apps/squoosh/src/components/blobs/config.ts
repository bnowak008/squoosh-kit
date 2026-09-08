import type { AmbientBlobConfig, HeroBlobLayer } from './types';

export const BLOB_COLOR = '#ff2d78';
export const AMBIENT_BLOB_COUNT = 14;

export function generateAmbientBlobs(count: number): AmbientBlobConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.floor(Math.random() * 50) + 16,
    top: `${(Math.random() * 80 + 5).toFixed(1)}%`,
    left: `${(Math.random() * 90 + 5).toFixed(1)}%`,
    opacity: parseFloat((Math.random() * 0.35 + 0.08).toFixed(2)),
    duration: `${(Math.random() * 7 + 5).toFixed(1)}s`,
    delay: `${(Math.random() * 5).toFixed(1)}s`,
  }));
}

export const HERO_BLOB_LAYERS: readonly HeroBlobLayer[] = [
  {
    size: 600,
    opacity: 0.05,
    morph: 'blob-morph-a',
    duration: '22s',
    delay: '0s',
    blur: 18,
    depth: 0.2,
  },
  {
    size: 550,
    opacity: 0.1,
    morph: 'blob-morph-b',
    duration: '28s',
    delay: '-6s',
    blur: 0,
    depth: 0.35,
  },
  {
    size: 500,
    opacity: 0.55,
    morph: 'blob-morph-c',
    duration: '18s',
    delay: '-3s',
    blur: 0,
    depth: 0.65,
  },
  {
    size: 450,
    opacity: 0.88,
    morph: 'blob-morph-d',
    duration: '24s',
    delay: '-10s',
    blur: 0,
    depth: 1,
  },
];

export const POINTER_MAX_PULL = 14;
export const POINTER_RADIUS = 400;
export const DRAG_MAX_PULL = 24;
export const DRAG_RADIUS = 380;
export const MOTION_LERP = 0.07;
export const MOTION_SKEW = 0.013;
export const MOBILE_MAX_WIDTH = 764;
