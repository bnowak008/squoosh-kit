/**
 * Type definitions for the Resize package
 */

/**
 * Options for resizing an image.
 * All WASM parameters are fully exposed through this interface.
 */
export type ResizeOptions = {
  /**
   * Target width of the resized image.
   * If only width is specified, height is calculated to maintain aspect ratio.
   * If both are specified, image is resized to exact dimensions.
   * Must be a positive integer (>= 1). Aspect ratio calculations will always preserve
   * at least 1 pixel for the missing dimension.
   * @default original image width
   */
  width?: number;
  /**
   * Target height of the resized image.
   * If only height is specified, width is calculated to maintain aspect ratio.
   * If both are specified, image is resized to exact dimensions.
   * Must be a positive integer (>= 1). Aspect ratio calculations will always preserve
   * at least 1 pixel for the missing dimension.
   * @default original image height
   */
  height?: number;
  /**
   * Resize algorithm to use - controls quality vs speed trade-off.
   * Maps directly to Squoosh WASM typ_idx parameter (0-3).
   * @default 'mitchell' - provides sensible balance between quality and performance
   */
  method?: 'triangular' | 'catrom' | 'mitchell' | 'lanczos3';
  /**
   * Pre-multiply alpha channel before resizing.
   * When true, alpha is multiplied into RGB values before the resize operation,
   * which can improve the quality of images with transparency.
   * Maps directly to WASM premultiply parameter.
   * @default false
   */
  premultiply?: boolean;
  /**
   * Use linear RGB color space for resizing instead of sRGB.
   * When true, applies proper color space conversion for more mathematically
   * accurate resizing of colors.
   * Maps directly to WASM color_space_conversion parameter.
   * @default false
   */
  linearRGB?: boolean;
};
