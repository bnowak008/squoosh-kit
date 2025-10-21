/**
 * Type definitions for the Resize package
 */

/**
 * Options for resizing an image.
 */
export type ResizeOptions = {
  /**
   * The target width of the resized image.
   */
  width?: number;
  /**
   * The target height of the resized image.
   */
  height?: number;
  /**
   * Premultiply the alpha channel.
   * @default false
   */
  premultiply?: boolean;
  /**
   * Use a linear RGB color space for resizing.
   * @default false
   */
  linearRGB?: boolean;
};
