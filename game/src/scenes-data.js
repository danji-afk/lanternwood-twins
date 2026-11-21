// The supplied artwork and circles are kept intact in the static server's root.
export { SCENES } from '../differences.js';
export const IMAGE_WIDTH = 1280;
export const IMAGE_HEIGHT = 800;
export const CHAPTERS = ['Where the water holds its breath', 'Above the sleeping city', 'A thousand miles of golden silence', 'Where the night learns to shine', 'One last light in the snow'];

/**
 * The area an <img> actually paints (object-fit: contain) inside its element box, in viewport
 * coordinates. Hit testing, the mark canvas and the magnifier all use this one answer, so they can
 * never disagree about where a difference sits.
 */
export function fittedBox(img) {
  const box = img.getBoundingClientRect();
  const scale = Math.min(box.width / IMAGE_WIDTH, box.height / IMAGE_HEIGHT);
  const width = IMAGE_WIDTH * scale;
  const height = IMAGE_HEIGHT * scale;
  return {
    left: box.left + (box.width - width) / 2,
    top: box.top + (box.height - height) / 2,
    width,
    height,
    scale,
  };
}
