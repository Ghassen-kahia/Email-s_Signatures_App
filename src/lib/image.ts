/**
 * Local image processing. Files are read with FileReader and downscaled on a
 * canvas entirely in the browser — nothing is uploaded anywhere.
 */

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_INPUT_BYTES = 8 * 1024 * 1024;

export class ImageError extends Error {}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ImageError('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageError('That file is not a readable image.'));
    img.src = src;
  });
}

/**
 * Downscale an image so its longest side is at most `maxSide` px (about 2x the
 * display size keeps it crisp on high-DPI screens) and return a compact data URL.
 */
export async function processImage(file: File, maxSide: number, square = false): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new ImageError('Use a PNG, JPEG, WebP or GIF image.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageError('Image is larger than 8 MB — please pick a smaller file.');
  }
  const img = await loadImage(await readAsDataUrl(file));

  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (square) {
    const side = Math.min(sw, sh);
    sx = (sw - side) / 2;
    sy = (sh - side) / 2;
    sw = sh = side;
  }
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('Your browser could not process this image.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

  // Keep transparency for logos (PNG); photos compress far better as JPEG.
  return file.type === 'image/png' && !square ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.86);
}

export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.round((base64.length * 3) / 4);
}
