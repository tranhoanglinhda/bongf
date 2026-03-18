import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/config';

const STORAGE_UPLOAD_TIMEOUT_MS = 5000;

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

const sanitizeName = (name: string): string => name.replace(/[^a-zA-Z0-9.-]/g, '_');

export const uploadPostImage = async (file: File): Promise<string> => {
  if (!storage) {
    return toDataUrl(file);
  }

  const filePath = `posts/${Date.now()}-${sanitizeName(file.name)}`;
  const imageRef = ref(storage, filePath);

  try {
    await withTimeout(uploadBytes(imageRef, file), STORAGE_UPLOAD_TIMEOUT_MS);
    return withTimeout(getDownloadURL(imageRef), STORAGE_UPLOAD_TIMEOUT_MS);
  } catch (error) {
    console.warn('Storage upload failed, using inline image fallback.', error);
    return toDataUrl(file);
  }
};
