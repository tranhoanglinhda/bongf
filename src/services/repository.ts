import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { GiftItem, PostInput, PostItem, ProductInput, ProductItem } from '../types/models';
import { normalizePostCategory } from '../utils/postCategories';

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
const FIRESTORE_REST_TIMEOUT_MS = 10_000;

const envListLimit = Number(import.meta.env.VITE_FIRESTORE_LIST_LIMIT ?? '50');
const FIRESTORE_LIST_LIMIT = Number.isFinite(envListLimit) && envListLimit > 0 ? Math.floor(envListLimit) : 50;
const FIRESTORE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const FIRESTORE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const canUseFirestoreRestFallback = Boolean(FIRESTORE_PROJECT_ID && FIRESTORE_API_KEY);

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

const isToMillisError = (error: unknown): boolean =>
  error instanceof Error && /tomillis/i.test(error.message);

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

type RestFieldValue = {
  stringValue?: string;
  timestampValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
};

type RestDocument = {
  name: string;
  fields?: Record<string, RestFieldValue>;
};

const getRestDocumentId = (name: string): string => name.split('/').pop() ?? crypto.randomUUID();

const getRestFieldString = (fields: Record<string, RestFieldValue> | undefined, key: string): string => {
  const field = fields?.[key];
  if (!field) return '';
  if (typeof field.stringValue === 'string') return field.stringValue;
  if (typeof field.timestampValue === 'string') return field.timestampValue;
  if (typeof field.integerValue === 'string') return field.integerValue;
  if (typeof field.doubleValue === 'number') return String(field.doubleValue);
  if (typeof field.booleanValue === 'boolean') return String(field.booleanValue);
  return '';
};

const getRestCreatedAt = (fields: Record<string, RestFieldValue> | undefined): string => {
  const raw = fields?.createdAt;
  if (raw?.timestampValue) return raw.timestampValue;
  if (raw?.stringValue) return raw.stringValue;
  return new Date().toISOString();
};

const fetchFirestoreDocumentsViaRest = async (collectionName: string): Promise<RestDocument[]> => {
  if (!canUseFirestoreRestFallback) {
    throw new Error('Firestore REST fallback is unavailable because Firebase env vars are missing.');
  }

  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(FIRESTORE_PROJECT_ID)}` +
    `/databases/(default)/documents/${encodeURIComponent(collectionName)}` +
    `?pageSize=${FIRESTORE_LIST_LIMIT}&key=${encodeURIComponent(FIRESTORE_API_KEY)}`;

  const response = await withTimeout(fetch(url), FIRESTORE_REST_TIMEOUT_MS);
  if (!response.ok) {
    throw new Error(`Firestore REST request failed (${response.status}).`);
  }

  const payload = (await response.json()) as { documents?: RestDocument[] };
  return payload.documents ?? [];
};

const fetchFirestoreDocumentViaRest = async (
  collectionName: string,
  documentId: string,
): Promise<RestDocument | null> => {
  if (!canUseFirestoreRestFallback) {
    throw new Error('Firestore REST fallback is unavailable because Firebase env vars are missing.');
  }

  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(FIRESTORE_PROJECT_ID)}` +
    `/databases/(default)/documents/${encodeURIComponent(collectionName)}/${encodeURIComponent(documentId)}` +
    `?key=${encodeURIComponent(FIRESTORE_API_KEY)}`;

  const response = await withTimeout(fetch(url), FIRESTORE_REST_TIMEOUT_MS);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Firestore REST request failed (${response.status}).`);
  }

  return (await response.json()) as RestDocument;
};

const listPostsViaRest = async (): Promise<PostItem[]> => {
  const docs = await fetchFirestoreDocumentsViaRest('posts');
  const mapped = docs.map((docItem) => ({
    id: getRestDocumentId(docItem.name),
    title: getRestFieldString(docItem.fields, 'title'),
    image: getRestFieldString(docItem.fields, 'image'),
    description: getRestFieldString(docItem.fields, 'description'),
    category: normalizePostCategory(getRestFieldString(docItem.fields, 'category')),
    createdAt: getRestCreatedAt(docItem.fields),
  }));
  return sortByDateDesc(mapped);
};

const listProductsViaRest = async (): Promise<ProductItem[]> => {
  const docs = await fetchFirestoreDocumentsViaRest('products');
  const mapped = docs.map((docItem) => {
    const shop = getRestFieldString(docItem.fields, 'shop') === 'shopee' ? 'shopee' : 'amazon';
    return {
      id: getRestDocumentId(docItem.name),
      name: getRestFieldString(docItem.fields, 'name'),
      image: getRestFieldString(docItem.fields, 'image'),
      affiliateUrl: getRestFieldString(docItem.fields, 'affiliateUrl'),
      shop,
      createdAt: getRestCreatedAt(docItem.fields),
    } satisfies ProductItem;
  });
  return sortByDateDesc(mapped);
};

const listGiftEmailsViaRest = async (): Promise<GiftItem[]> => {
  const docs = await fetchFirestoreDocumentsViaRest('gifts');
  const mapped = docs.map((docItem) => ({
    id: getRestDocumentId(docItem.name),
    email: getRestFieldString(docItem.fields, 'email'),
    createdAt: getRestCreatedAt(docItem.fields),
  }));
  return sortByDateDesc(mapped);
};

const getPostByIdViaRest = async (id: string): Promise<PostItem | null> => {
  const docItem = await fetchFirestoreDocumentViaRest('posts', id);
  if (!docItem) return null;

  return {
    id: getRestDocumentId(docItem.name),
    title: getRestFieldString(docItem.fields, 'title'),
    image: getRestFieldString(docItem.fields, 'image'),
    description: getRestFieldString(docItem.fields, 'description'),
    category: normalizePostCategory(getRestFieldString(docItem.fields, 'category')),
    createdAt: getRestCreatedAt(docItem.fields),
  };
};

const mapPostDoc = (item: QueryDocumentSnapshot): PostItem => {
  const data = item.data() as {
    title: string;
    image: string;
    description: string;
    category?: string;
    createdAt?: unknown;
  };
  return {
    id: item.id,
    title: data.title,
    image: data.image,
    description: data.description,
    category: normalizePostCategory(data.category),
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

const normalizePostItem = (item: PostItem & Partial<Pick<PostItem, 'category'>>): PostItem => ({
  ...item,
  category: normalizePostCategory(item.category),
});

export const listPosts = async (): Promise<PostItem[]> => {
  if (postListCache.data && isCacheFresh(postListCache.timestamp)) {
    return [...postListCache.data];
  }

  if (!db) {
    const localPosts = sortByDateDesc(getLocalList<PostItem>(STORAGE_KEYS.posts).map(normalizePostItem));
    postListCache.data = localPosts;
    postListCache.timestamp = Date.now();
    return [...localPosts];
  }

  try {
    const q = query(collection(db, 'posts'), limit(FIRESTORE_LIST_LIMIT));
    const snapshot = await withRetryOnTimeout(() => withTimeout(getDocs(q), FIRESTORE_LIST_TIMEOUT_MS));
    const data = sortByDateDesc(snapshot.docs.map(mapPostDoc));
    postListCache.data = data;
    postListCache.timestamp = Date.now();
    return [...data];
  } catch (error) {
    if (isToMillisError(error)) {
      const data = await listPostsViaRest();
      postListCache.data = data;
      postListCache.timestamp = Date.now();
      return [...data];
    }

    console.warn('Failed to list posts from Firestore.', error);
    throw error;
  }
};

export const getPostById = async (id: string): Promise<PostItem | null> => {
  if (!db) {
    const post = getLocalList<PostItem>(STORAGE_KEYS.posts).map(normalizePostItem).find((item) => item.id === id) ?? null;
    return post;
  }

  const firestore = db;

  try {
    const snapshot = await withRetryOnTimeout(() =>
      withTimeout(getDoc(doc(firestore, 'posts', id)), FIRESTORE_DOC_TIMEOUT_MS),
    );
    if (!snapshot.exists()) return null;
    const data = snapshot.data() as {
      title: string;
      image: string;
      description: string;
      category?: string;
      createdAt?: unknown;
    };
    return {
      id: snapshot.id,
      title: data.title,
      image: data.image,
      description: data.description,
      category: normalizePostCategory(data.category),
      createdAt: toIsoDate(data.createdAt),
    };
  } catch (error) {
    if (isToMillisError(error)) {
      return getPostByIdViaRest(id);
    }

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
      const q = query(collection(db, 'products'), limit(FIRESTORE_LIST_LIMIT));
      const snapshot = await withRetryOnTimeout(() => withTimeout(getDocs(q), FIRESTORE_LIST_TIMEOUT_MS));
      const data = sortByDateDesc(snapshot.docs.map(mapProductDoc));
      productListCache.data = data;
      productListCache.timestamp = Date.now();
      return [...data];
    } catch (error) {
      if (isToMillisError(error)) {
        const data = await listProductsViaRest();
        productListCache.data = data;
        productListCache.timestamp = Date.now();
        return [...data];
      }

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
      const q = query(collection(db, 'gifts'), limit(FIRESTORE_LIST_LIMIT));
      const snapshot = await withRetryOnTimeout(() => withTimeout(getDocs(q), FIRESTORE_LIST_TIMEOUT_MS));
      const data = sortByDateDesc(snapshot.docs.map(mapGiftDoc));
      giftListCache.data = data;
      giftListCache.timestamp = Date.now();
      return [...data];
    } catch (error) {
      if (isToMillisError(error)) {
        const data = await listGiftEmailsViaRest();
        giftListCache.data = data;
        giftListCache.timestamp = Date.now();
        return [...data];
      }

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
