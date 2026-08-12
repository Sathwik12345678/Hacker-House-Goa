// Handles loading uploaded photos into the browser and preparing them
// for Canvas rendering: downscaling huge photos, and computing an
// "object-fit: cover" style crop rectangle so any aspect ratio fills
// its target area without stretching or distorting the subject.

export const SUPPORTED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];
export const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
export const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30MB, generous phone-camera ceiling
const MAX_DIMENSION = 2200; // downscale ceiling before any processing

export class ImageProcessingError extends Error {}

export function isSupportedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const typeOk = SUPPORTED_TYPES.includes(file.type.toLowerCase());
  const extOk = SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  return typeOk || extOk;
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageProcessingError('This file could not be read as an image.'));
    };
    img.src = url;
  });
}

/**
 * Downscales very large photos onto an offscreen canvas so later
 * processing stays fast (~1-3s target), then returns a fresh Image
 * pointing at the resized bitmap.
 */
export async function normaliseImage(file: File): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  const rawImage = await loadImageFromFile(file);
  const { naturalWidth: w, naturalHeight: h } = rawImage;

  if (w === 0 || h === 0) {
    throw new ImageProcessingError('This image appears to be empty or corrupted.');
  }

  const longEdge = Math.max(w, h);
  if (longEdge <= MAX_DIMENSION) {
    // Small enough already — reuse as-is via its object URL.
    const objectUrl = rawImage.src;
    return { image: rawImage, objectUrl };
  }

  const scale = MAX_DIMENSION / longEdge;
  const targetW = Math.round(w * scale);
  const targetH = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageProcessingError('Canvas is not supported in this browser.');
  ctx.drawImage(rawImage, 0, 0, targetW, targetH);

  URL.revokeObjectURL(rawImage.src);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) throw new ImageProcessingError('Could not resize this image.');

  const resizedImage = await loadImageFromFile(new File([blob], 'resized.jpg', { type: 'image/jpeg' }));
  return { image: resizedImage, objectUrl: resizedImage.src };
}

export interface CoverRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * Computes the source rectangle to draw from `image` so that it fills a
 * `targetW x targetH` area exactly like CSS `object-fit: cover`, biased
 * toward the vertical center-ish of the frame (slightly above center,
 * where faces usually sit) instead of a plain center crop.
 */
export function computeCoverRect(
  imgW: number,
  imgH: number,
  targetW: number,
  targetH: number,
  verticalBias = 0.42
): CoverRect {
  const targetRatio = targetW / targetH;
  const imgRatio = imgW / imgH;

  let sw: number;
  let sh: number;

  if (imgRatio > targetRatio) {
    // Image is relatively wider than target — crop the sides.
    sh = imgH;
    sw = sh * targetRatio;
  } else {
    // Image is relatively taller than target — crop top/bottom.
    sw = imgW;
    sh = sw / targetRatio;
  }

  const sx = Math.max(0, (imgW - sw) / 2);
  const maxSy = Math.max(0, imgH - sh);
  const sy = Math.min(maxSy, Math.max(0, (imgH - sh) * verticalBias));

  return { sx, sy, sw, sh };
}
