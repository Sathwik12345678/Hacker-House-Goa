// Converts HEIC/HEIF photos (common on iPhones) to a browser-friendly
// JPEG before we ever touch them with Canvas. Regular JPG/PNG files are
// passed straight through.

export class HeicConversionError extends Error {}

function isHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
}

export async function ensureBrowserFriendlyImage(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    const heic2any = (await import('heic2any')).default;
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });

    // heic2any can resolve to a single Blob or an array of Blobs
    // (for multi-image HEIC containers) — we only need the first frame.
    const blob = Array.isArray(result) ? result[0] : result;

    if (!blob) {
      throw new HeicConversionError('No image data returned from HEIC conversion.');
    }

    const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    return new File([blob], newName || 'photo.jpg', { type: 'image/jpeg' });
  } catch (error) {
    throw new HeicConversionError(
      'We could not convert this HEIC/HEIF photo. Please try a JPG or PNG instead.'
    );
  }
}
