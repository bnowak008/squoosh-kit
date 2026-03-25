import { validateImageInput } from '@squoosh-kit/runtime';
import type { ImageInput } from '@squoosh-kit/runtime';

export { validateImageInput };

export function validatePngInput(image: ImageInput): void {
  validateImageInput(image);
}
