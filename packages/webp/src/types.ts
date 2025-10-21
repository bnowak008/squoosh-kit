/**
 * Type definitions for the WebP package
 */

/**
 * Options for WebP encoding.
 */
export type WebpOptions = {
  /**
   * Quality, 0-100.
   * @default 82
   */
  quality?: number;
  /**
   * Use lossless compression.
   * @default false
   */
  lossless?: boolean;
  /**
   * Use near-lossless compression.
   * @default false
   */
  nearLossless?: boolean;
};
