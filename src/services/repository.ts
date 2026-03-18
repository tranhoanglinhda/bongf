import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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
  if (db) {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapPostDoc);
  }

  return sortByDateDesc(getLocalList<PostItem>(STORAGE_KEYS.posts));
};

export const getPostById = async (id: string): Promise<PostItem | null> => {
  if (db) {
    const snapshot = await getDoc(doc(db, 'posts', id));
    if (!snapshot.exists()) return null;
    const data = snapshot.data() as { title: string; image: string; description: string; createdAt?: unknown };
    return {
      id: snapshot.id,
      title: data.title,
      image: data.image,
      description: data.description,
      createdAt: toIsoDate(data.createdAt),
    };
  }

  return getLocalList<PostItem>(STORAGE_KEYS.posts).find((item) => item.id === id) ?? null;
};

export const createPost = async (payload: PostInput): Promise<void> => {
  if (db) {
    await addDoc(collection(db, 'posts'), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return;
  }

  const posts = getLocalList<PostItem>(STORAGE_KEYS.posts);
  posts.push({
    id: crypto.randomUUID(),
    ...payload,
    createdAt: new Date().toISOString(),
  });
  setLocalList(STORAGE_KEYS.posts, posts);
};

export const updatePostItem = async (id: string, payload: PostInput): Promise<void> => {
  if (db) {
    await updateDoc(doc(db, 'posts', id), { ...payload });
    return;
  }

  const posts = getLocalList<PostItem>(STORAGE_KEYS.posts).map((item) =>
    item.id === id ? { ...item, ...payload } : item,
  );
  setLocalList(STORAGE_KEYS.posts, posts);
};

export const deletePostItem = async (id: string): Promise<void> => {
  if (db) {
    await deleteDoc(doc(db, 'posts', id));
    return;
  }

  const posts = getLocalList<PostItem>(STORAGE_KEYS.posts).filter((item) => item.id !== id);
  setLocalList(STORAGE_KEYS.posts, posts);
};

export const listProducts = async (): Promise<ProductItem[]> => {
  if (db) {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapProductDoc);
  }

  return sortByDateDesc(getLocalList<ProductItem>(STORAGE_KEYS.products));
};

export const createProduct = async (payload: ProductInput): Promise<void> => {
  if (db) {
    await addDoc(collection(db, 'products'), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return;
  }

  const products = getLocalList<ProductItem>(STORAGE_KEYS.products);
  products.push({
    id: crypto.randomUUID(),
    ...payload,
    createdAt: new Date().toISOString(),
  });
  setLocalList(STORAGE_KEYS.products, products);
};

export const updateProductItem = async (id: string, payload: ProductInput): Promise<void> => {
  if (db) {
    await updateDoc(doc(db, 'products', id), { ...payload });
    return;
  }

  const products = getLocalList<ProductItem>(STORAGE_KEYS.products).map((item) =>
    item.id === id ? { ...item, ...payload } : item,
  );
  setLocalList(STORAGE_KEYS.products, products);
};

export const deleteProductItem = async (id: string): Promise<void> => {
  if (db) {
    await deleteDoc(doc(db, 'products', id));
    return;
  }

  const products = getLocalList<ProductItem>(STORAGE_KEYS.products).filter((item) => item.id !== id);
  setLocalList(STORAGE_KEYS.products, products);
};

export const createGiftEmail = async (email: string): Promise<void> => {
  if (db) {
    await addDoc(collection(db, 'gifts'), {
      email,
      createdAt: serverTimestamp(),
    });
    return;
  }

  const gifts = getLocalList<GiftItem>(STORAGE_KEYS.gifts);
  gifts.push({
    id: crypto.randomUUID(),
    email,
    createdAt: new Date().toISOString(),
  });
  setLocalList(STORAGE_KEYS.gifts, gifts);
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
