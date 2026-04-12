import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/config';

const STORAGE_UPLOAD_TIMEOUT_MS = 5000;
const FALLBACK_MAX_DIMENSION = 1280;
const FALLBACK_IMAGE_QUALITY = 0.82;

type UploadPostImageOptions = {
  allowInlineFallback?: boolean;
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Storage upload timeout.')), ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });

const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

const toCompressedDataUrl = async (file: File): Promise<string> => {
  const imageUrl = await toDataUrl(file);

  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') {
    return imageUrl;
  }

  const bitmap = await createImageBitmap(file);
  const longestSide = Math.max(bitmap.width, bitmap.height);
  const scale = longestSide > FALLBACK_MAX_DIMENSION ? FALLBACK_MAX_DIMENSION / longestSide : 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext('2d');
  if (!context) {
    return imageUrl;
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  return canvas.toDataURL(mimeType, FALLBACK_IMAGE_QUALITY);
};

const sanitizeName = (name: string): string => name.replace(/[^a-zA-Z0-9.-]/g, '_');

export const uploadPostImage = async (file: File, options: UploadPostImageOptions = {}): Promise<string> => {
  const allowInlineFallback = options.allowInlineFallback ?? true;

  if (!storage) {
    if (!allowInlineFallback) {
      throw new Error('Image storage is unavailable for embedded content.');
    }

    return toCompressedDataUrl(file);
  }

  const filePath = `posts/${Date.now()}-${sanitizeName(file.name)}`;
  const imageRef = ref(storage, filePath);

  try {
    await withTimeout(uploadBytes(imageRef, file), STORAGE_UPLOAD_TIMEOUT_MS);
    return withTimeout(getDownloadURL(imageRef), STORAGE_UPLOAD_TIMEOUT_MS);
  } catch (error) {
    if (!allowInlineFallback) {
      throw error;
    }

    console.warn('Storage upload failed, using inline image fallback.', error);
    return toCompressedDataUrl(file);
  }
};
