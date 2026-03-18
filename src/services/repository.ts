import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { GiftItem, PostInput, PostItem, ProductInput, ProductItem } from '../types/models';

const STORAGE_KEYS = {
  posts: 'bongf_posts',
  products: 'bongf_products',
  gifts: 'bongf_gifts',
} as const;

const FIRESTORE_LIST_TIMEOUT_MS = 10_000;
const FIRESTORE_DOC_TIMEOUT_MS = 10_000;
const FIRESTORE_WRITE_TIMEOUT_MS = 5000;
const LIST_CACHE_TTL_MS = 60_000;
const FIRESTORE_READ_RETRIES = 1;
const FIRESTORE_RETRY_DELAY_MS = 400;

const envListLimit = Number(import.meta.env.VITE_FIRESTORE_LIST_LIMIT ?? '50');
const FIRESTORE_LIST_LIMIT = Number.isFinite(envListLimit) && envListLimit > 0 ? Math.floor(envListLimit) : 50;

type CacheEntry<T> = {
  data: T[] | null;
  timestamp: number;
};

const postListCache: CacheEntry<PostItem> = { data: null, timestamp: 0 };
const productListCache: CacheEntry<ProductItem> = { data: null, timestamp: 0 };
const giftListCache: CacheEntry<GiftItem> = { data: null, timestamp: 0 };

const isCacheFresh = (timestamp: number): boolean => Date.now() - timestamp < LIST_CACHE_TTL_MS;

const invalidatePostCache = (): void => {
  postListCache.data = null;
  postListCache.timestamp = 0;
};

const invalidateProductCache = (): void => {
  productListCache.data = null;
  productListCache.timestamp = 0;
};

const invalidateGiftCache = (): void => {
  giftListCache.data = null;
  giftListCache.timestamp = 0;
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Firestore request timeout after ${ms}ms.`)), ms);

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

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const isTimeoutError = (error: unknown): boolean =>
  error instanceof Error && /timeout/i.test(error.message);

const withRetryOnTimeout = async <T>(run: () => Promise<T>, retries = FIRESTORE_READ_RETRIES): Promise<T> => {
  let attemptsLeft = retries;

  while (true) {
    try {
      return await run();
    } catch (error) {
      if (!isTimeoutError(error) || attemptsLeft <= 0) throw error;
      attemptsLeft -= 1;
      await wait(FIRESTORE_RETRY_DELAY_MS);
    }
  }
};

const toIsoDate = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toDate' in value) {
    const toDate = (value as { toDate: () => Date }).toDate;
    return toDate().toISOString();
  }
  return new Date().toISOString();
};

const mapPostDoc = (item: QueryDocumentSnapshot): PostItem => {
  const data = item.data() as { title: string; image: string; description: string; createdAt?: unknown };
  return {
    id: item.id,
    title: data.title,
    image: data.image,
    description: data.description,
    createdAt: toIsoDate(data.createdAt),
  };
};

const mapProductDoc = (item: QueryDocumentSnapshot): ProductItem => {
  const data = item.data() as {
    name: string;
    image: string;
    affiliateUrl: string;
    shop: 'amazon' | 'shopee';
    createdAt?: unknown;
  };

  return {
    id: item.id,
    name: data.name,
    image: data.image,
    affiliateUrl: data.affiliateUrl,
    shop: data.shop,
    createdAt: toIsoDate(data.createdAt),
  };
};

const mapGiftDoc = (item: QueryDocumentSnapshot): GiftItem => {
  const data = item.data() as { email: string; createdAt?: unknown };

  return {
    id: item.id,
    email: data.email,
    createdAt: toIsoDate(data.createdAt),
  };
};

const getLocalList = <T>(key: string): T[] => {
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
};

const setLocalList = <T>(key: string, value: T[]): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

const sortByDateDesc = <T extends { createdAt: string }>(items: T[]): T[] =>
  items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

export const listPosts = async (): Promise<PostItem[]> => {
  if (postListCache.data && isCacheFresh(postListCache.timestamp)) {
    return [...postListCache.data];
  }

  if (!db) {
    const localPosts = sortByDateDesc(getLocalList<PostItem>(STORAGE_KEYS.posts));
    postListCache.data = localPosts;
    postListCache.timestamp = Date.now();
    return [...localPosts];
  }

  try {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(FIRESTORE_LIST_LIMIT));
    const snapshot = await withRetryOnTimeout(() => withTimeout(getDocs(q), FIRESTORE_LIST_TIMEOUT_MS));
    const data = snapshot.docs.map(mapPostDoc);
    postListCache.data = data;
    postListCache.timestamp = Date.now();
    return [...data];
  } catch (error) {
    console.warn('Failed to list posts from Firestore.', error);
    throw error;
  }
};

export const getPostById = async (id: string): Promise<PostItem | null> => {
  if (!db) {
    return getLocalList<PostItem>(STORAGE_KEYS.posts).find((item) => item.id === id) ?? null;
  }

  const firestore = db;

  try {
    const snapshot = await withRetryOnTimeout(() =>
      withTimeout(getDoc(doc(firestore, 'posts', id)), FIRESTORE_DOC_TIMEOUT_MS),
    );
    if (!snapshot.exists()) return null;
    const data = snapshot.data() as { title: string; image: string; description: string; createdAt?: unknown };
    return {
      id: snapshot.id,
      title: data.title,
      image: data.image,
      description: data.description,
      createdAt: toIsoDate(data.createdAt),
    };
  } catch (error) {
    console.warn('Failed to load post by id from Firestore.', error);
    throw error;
  }
};

export const createPost = async (payload: PostInput): Promise<void> => {
  if (!db) {
    const posts = getLocalList<PostItem>(STORAGE_KEYS.posts);
    posts.push({
      id: crypto.randomUUID(),
      ...payload,
      createdAt: new Date().toISOString(),
    });
    setLocalList(STORAGE_KEYS.posts, posts);
    invalidatePostCache();
    return;
  }

  try {
    await withTimeout(
      addDoc(collection(db, 'posts'), {
        ...payload,
        createdAt: serverTimestamp(),
      }),
      FIRESTORE_WRITE_TIMEOUT_MS,
    );
    invalidatePostCache();
  } catch (error) {
    console.warn('Failed to create post in Firestore.', error);
    throw error;
  }
};

export const updatePostItem = async (id: string, payload: PostInput): Promise<void> => {
  if (!db) {
    const posts = getLocalList<PostItem>(STORAGE_KEYS.posts).map((item) =>
      item.id === id ? { ...item, ...payload } : item,
    );
    setLocalList(STORAGE_KEYS.posts, posts);
    invalidatePostCache();
    return;
  }

  try {
    await withTimeout(updateDoc(doc(db, 'posts', id), { ...payload }), FIRESTORE_WRITE_TIMEOUT_MS);
    invalidatePostCache();
  } catch (error) {
    console.warn('Failed to update post in Firestore.', error);
    throw error;
  }
};

export const deletePostItem = async (id: string): Promise<void> => {
  if (!db) {
    const posts = getLocalList<PostItem>(STORAGE_KEYS.posts).filter((item) => item.id !== id);
    setLocalList(STORAGE_KEYS.posts, posts);
    invalidatePostCache();
    return;
  }

  try {
    await withTimeout(deleteDoc(doc(db, 'posts', id)), FIRESTORE_WRITE_TIMEOUT_MS);
    invalidatePostCache();
  } catch (error) {
    console.warn('Failed to delete post in Firestore.', error);
    throw error;
  }
};

export const listProducts = async (): Promise<ProductItem[]> => {
  if (productListCache.data && isCacheFresh(productListCache.timestamp)) {
    return [...productListCache.data];
  }

  if (db) {
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(FIRESTORE_LIST_LIMIT));
      const snapshot = await withRetryOnTimeout(() => withTimeout(getDocs(q), FIRESTORE_LIST_TIMEOUT_MS));
      const data = snapshot.docs.map(mapProductDoc);
      productListCache.data = data;
      productListCache.timestamp = Date.now();
      return [...data];
    } catch (error) {
      console.warn('Failed to list products from Firestore, using localStorage fallback.', error);
    }
  }

  const localProducts = sortByDateDesc(getLocalList<ProductItem>(STORAGE_KEYS.products));
  productListCache.data = localProducts;
  productListCache.timestamp = Date.now();
  return [...localProducts];
};

export const createProduct = async (payload: ProductInput): Promise<void> => {
  if (db) {
    try {
      await withTimeout(
        addDoc(collection(db, 'products'), {
          ...payload,
          createdAt: serverTimestamp(),
        }),
        FIRESTORE_WRITE_TIMEOUT_MS,
      );
      invalidateProductCache();
      return;
    } catch (error) {
      console.warn('Failed to create product in Firestore, saving to localStorage fallback.', error);
    }
  }

  const products = getLocalList<ProductItem>(STORAGE_KEYS.products);
  products.push({
    id: crypto.randomUUID(),
    ...payload,
    createdAt: new Date().toISOString(),
  });
  setLocalList(STORAGE_KEYS.products, products);
  invalidateProductCache();
};

export const updateProductItem = async (id: string, payload: ProductInput): Promise<void> => {
  if (db) {
    try {
      await withTimeout(updateDoc(doc(db, 'products', id), { ...payload }), FIRESTORE_WRITE_TIMEOUT_MS);
      invalidateProductCache();
      return;
    } catch (error) {
      console.warn('Failed to update product in Firestore, updating localStorage fallback.', error);
    }
  }

  const products = getLocalList<ProductItem>(STORAGE_KEYS.products).map((item) =>
    item.id === id ? { ...item, ...payload } : item,
  );
  setLocalList(STORAGE_KEYS.products, products);
  invalidateProductCache();
};

export const deleteProductItem = async (id: string): Promise<void> => {
  if (db) {
    try {
      await withTimeout(deleteDoc(doc(db, 'products', id)), FIRESTORE_WRITE_TIMEOUT_MS);
      invalidateProductCache();
      return;
    } catch (error) {
      console.warn('Failed to delete product in Firestore, deleting from localStorage fallback.', error);
    }
  }

  const products = getLocalList<ProductItem>(STORAGE_KEYS.products).filter((item) => item.id !== id);
  setLocalList(STORAGE_KEYS.products, products);
  invalidateProductCache();
};

export const createGiftEmail = async (email: string): Promise<void> => {
  if (db) {
    try {
      await withTimeout(
        addDoc(collection(db, 'gifts'), {
          email,
          createdAt: serverTimestamp(),
        }),
        FIRESTORE_WRITE_TIMEOUT_MS,
      );
      invalidateGiftCache();
      return;
    } catch (error) {
      console.warn('Failed to create gift email in Firestore, saving to localStorage fallback.', error);
    }
  }

  const gifts = getLocalList<GiftItem>(STORAGE_KEYS.gifts);
  gifts.push({
    id: crypto.randomUUID(),
    email,
    createdAt: new Date().toISOString(),
  });
  setLocalList(STORAGE_KEYS.gifts, gifts);
  invalidateGiftCache();
};

export const listGiftEmails = async (): Promise<GiftItem[]> => {
  if (giftListCache.data && isCacheFresh(giftListCache.timestamp)) {
    return [...giftListCache.data];
  }

  if (db) {
    try {
      const q = query(collection(db, 'gifts'), orderBy('createdAt', 'desc'), limit(FIRESTORE_LIST_LIMIT));
      const snapshot = await withRetryOnTimeout(() => withTimeout(getDocs(q), FIRESTORE_LIST_TIMEOUT_MS));
      const data = snapshot.docs.map(mapGiftDoc);
      giftListCache.data = data;
      giftListCache.timestamp = Date.now();
      return [...data];
    } catch (error) {
      console.warn('Failed to list gift emails from Firestore, using localStorage fallback.', error);
    }
  }

  const localGifts = sortByDateDesc(getLocalList<GiftItem>(STORAGE_KEYS.gifts));
  giftListCache.data = localGifts;
  giftListCache.timestamp = Date.now();
  return [...localGifts];
};

export const deleteGiftEmail = async (id: string): Promise<void> => {
  if (db) {
    try {
      await withTimeout(deleteDoc(doc(db, 'gifts', id)), FIRESTORE_WRITE_TIMEOUT_MS);
      invalidateGiftCache();
      return;
    } catch (error) {
      console.warn('Failed to delete gift email in Firestore, deleting from localStorage fallback.', error);
    }
  }

  const gifts = getLocalList<GiftItem>(STORAGE_KEYS.gifts).filter((item) => item.id !== id);
  setLocalList(STORAGE_KEYS.gifts, gifts);
  invalidateGiftCache();
};

const ADMIN_KEY = 'bongf_admin_session';
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? 'admin@abc.com';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? '12345678';

export const loginAdmin = (email: string, password: string): boolean => {
  if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_KEY, '1');
    return true;
  }
  return false;
};

export const isAdminLoggedIn = (): boolean => sessionStorage.getItem(ADMIN_KEY) === '1';

export const logoutAdmin = (): void => {
  sessionStorage.removeItem(ADMIN_KEY);
};
