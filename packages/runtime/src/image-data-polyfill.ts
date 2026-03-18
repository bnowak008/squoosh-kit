/**
 * Polyfill for ImageData in Node/Bun environments where it's not available.
 * Must be called before any WASM decode operation that returns ImageData.
 */
export function polyfillImageData(): void {
  if (typeof ImageData === 'undefined') {
    (
      globalThis as {
        ImageData?: new (
          data: Uint8ClampedArray,
          width: number,
          height: number
        ) => ImageData;
      }
    ).ImageData = class {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      colorSpace: PredefinedColorSpace = 'srgb';
      constructor(data: Uint8ClampedArray, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    } as unknown as typeof ImageData;
  }
}
