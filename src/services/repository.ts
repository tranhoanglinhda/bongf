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
import type { LinkItem, RecipeItem, WorkoutItem } from '../types/models';
import { SEED_LINKS, SEED_RECIPES, SEED_WORKOUTS } from '../data/bongfSeed';

const STORAGE_KEYS = {
  workouts: 'bongf_workouts',
  recipes: 'bongf_recipes',
  links: 'bongf_links',
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

/* ---------- shared primitives ---------- */

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
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
};

const sortByDateDesc = <T extends { createdAt: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

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

/* ---------- REST fallback value parsing ---------- */

type RestValue = {
  stringValue?: string;
  timestampValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  arrayValue?: { values?: RestValue[] };
  mapValue?: { fields?: Record<string, RestValue> };
};

type RestDocument = {
  name: string;
  fields?: Record<string, RestValue>;
};

const parseRestValue = (value: RestValue | undefined): unknown => {
  if (!value) return undefined;
  if (typeof value.stringValue === 'string') return value.stringValue;
  if (typeof value.timestampValue === 'string') return value.timestampValue;
  if (typeof value.integerValue === 'string') return Number(value.integerValue);
  if (typeof value.doubleValue === 'number') return value.doubleValue;
  if (typeof value.booleanValue === 'boolean') return value.booleanValue;
  if (value.arrayValue) return (value.arrayValue.values ?? []).map(parseRestValue);
  if (value.mapValue) return parseRestFields(value.mapValue.fields);
  return undefined;
};

const parseRestFields = (fields: Record<string, RestValue> | undefined): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields ?? {})) {
    result[key] = parseRestValue(value);
  }
  return result;
};

const getRestDocumentId = (name: string): string => name.split('/').pop() ?? crypto.randomUUID();

const fetchDocumentsViaRest = async (collectionName: string): Promise<RestDocument[]> => {
  if (!canUseFirestoreRestFallback) {
    throw new Error('Firestore REST fallback is unavailable because Firebase env vars are missing.');
  }
  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(FIRESTORE_PROJECT_ID)}` +
    `/databases/(default)/documents/${encodeURIComponent(collectionName)}` +
    `?pageSize=${FIRESTORE_LIST_LIMIT}&key=${encodeURIComponent(FIRESTORE_API_KEY)}`;
  const response = await withTimeout(fetch(url), FIRESTORE_REST_TIMEOUT_MS);
  if (!response.ok) throw new Error(`Firestore REST request failed (${response.status}).`);
  const payload = (await response.json()) as { documents?: RestDocument[] };
  return payload.documents ?? [];
};

const fetchDocumentViaRest = async (collectionName: string, id: string): Promise<RestDocument | null> => {
  if (!canUseFirestoreRestFallback) {
    throw new Error('Firestore REST fallback is unavailable because Firebase env vars are missing.');
  }
  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(FIRESTORE_PROJECT_ID)}` +
    `/databases/(default)/documents/${encodeURIComponent(collectionName)}/${encodeURIComponent(id)}` +
    `?key=${encodeURIComponent(FIRESTORE_API_KEY)}`;
  const response = await withTimeout(fetch(url), FIRESTORE_REST_TIMEOUT_MS);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore REST request failed (${response.status}).`);
  return (await response.json()) as RestDocument;
};

/* ---------- generic collection store ---------- */

interface BaseItem {
  id: string;
  createdAt: string;
}

type CacheEntry<T> = { data: T[] | null; timestamp: number };

interface CollectionStore<T extends BaseItem, I> {
  list: () => Promise<T[]>;
  getById: (id: string) => Promise<T | null>;
  create: (payload: I) => Promise<void>;
  update: (id: string, payload: I) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const createStore = <T extends BaseItem, I>(
  collectionName: string,
  storageKey: string,
  mapFields: (raw: Record<string, unknown>) => Omit<T, 'id' | 'createdAt'>,
  seed: T[],
): CollectionStore<T, I> => {
  const cache: CacheEntry<T> = { data: null, timestamp: 0 };
  const isCacheFresh = (): boolean => cache.data !== null && Date.now() - cache.timestamp < LIST_CACHE_TTL_MS;
  const remember = (data: T[]): T[] => {
    cache.data = data;
    cache.timestamp = Date.now();
    return [...data];
  };
  const invalidate = (): void => {
    cache.data = null;
    cache.timestamp = 0;
  };

  const ensureSeededLocally = (): T[] => {
    const existing = getLocalList<T>(storageKey);
    if (existing.length > 0) return existing;
    setLocalList(storageKey, seed);
    return [...seed];
  };

  const mapSnapshot = (snapshot: QueryDocumentSnapshot): T =>
    ({
      ...mapFields(snapshot.data() as Record<string, unknown>),
      id: snapshot.id,
      createdAt: toIsoDate((snapshot.data() as { createdAt?: unknown }).createdAt),
    }) as T;

  const mapRestDocument = (document: RestDocument): T => {
    const fields = parseRestFields(document.fields);
    return {
      ...mapFields(fields),
      id: getRestDocumentId(document.name),
      createdAt: toIsoDate(fields.createdAt),
    } as T;
  };

  const list = async (): Promise<T[]> => {
    if (isCacheFresh()) return [...(cache.data as T[])];

    if (!db) {
      return remember(sortByDateDesc(ensureSeededLocally()));
    }

    try {
      const q = query(collection(db, collectionName), limit(FIRESTORE_LIST_LIMIT));
      const snapshot = await withRetryOnTimeout(() => withTimeout(getDocs(q), FIRESTORE_LIST_TIMEOUT_MS));
      return remember(sortByDateDesc(snapshot.docs.map(mapSnapshot)));
    } catch (error) {
      if (isToMillisError(error)) {
        const docs = await fetchDocumentsViaRest(collectionName);
        return remember(sortByDateDesc(docs.map(mapRestDocument)));
      }
      console.warn(`Failed to list ${collectionName} from Firestore, using localStorage fallback.`, error);
      return remember(sortByDateDesc(ensureSeededLocally()));
    }
  };

  const getById = async (id: string): Promise<T | null> => {
    if (!db) {
      return ensureSeededLocally().find((item) => item.id === id) ?? null;
    }

    const firestore = db;
    try {
      const snapshot = await withRetryOnTimeout(() =>
        withTimeout(getDoc(doc(firestore, collectionName, id)), FIRESTORE_DOC_TIMEOUT_MS),
      );
      if (!snapshot.exists()) return null;
      return {
        ...mapFields(snapshot.data() as Record<string, unknown>),
        id: snapshot.id,
        createdAt: toIsoDate((snapshot.data() as { createdAt?: unknown }).createdAt),
      } as T;
    } catch (error) {
      if (isToMillisError(error)) {
        const document = await fetchDocumentViaRest(collectionName, id);
        return document ? mapRestDocument(document) : null;
      }
      console.warn(`Failed to load ${collectionName}/${id} from Firestore.`, error);
      throw error;
    }
  };

  const create = async (payload: I): Promise<void> => {
    if (db) {
      try {
        await withTimeout(
          addDoc(collection(db, collectionName), { ...(payload as Record<string, unknown>), createdAt: serverTimestamp() }),
          FIRESTORE_WRITE_TIMEOUT_MS,
        );
        invalidate();
        return;
      } catch (error) {
        console.warn(`Failed to create ${collectionName} in Firestore, saving to localStorage.`, error);
      }
    }

    const items = getLocalList<T>(storageKey);
    items.unshift({ ...(payload as object), id: crypto.randomUUID(), createdAt: new Date().toISOString() } as T);
    setLocalList(storageKey, items);
    invalidate();
  };

  const update = async (id: string, payload: I): Promise<void> => {
    if (db) {
      try {
        await withTimeout(
          updateDoc(doc(db, collectionName, id), { ...(payload as Record<string, unknown>) }),
          FIRESTORE_WRITE_TIMEOUT_MS,
        );
        invalidate();
        return;
      } catch (error) {
        console.warn(`Failed to update ${collectionName} in Firestore, updating localStorage.`, error);
      }
    }

    const items = getLocalList<T>(storageKey).map((item) =>
      item.id === id ? ({ ...item, ...(payload as object) } as T) : item,
    );
    setLocalList(storageKey, items);
    invalidate();
  };

  const remove = async (id: string): Promise<void> => {
    if (db) {
      try {
        await withTimeout(deleteDoc(doc(db, collectionName, id)), FIRESTORE_WRITE_TIMEOUT_MS);
        invalidate();
        return;
      } catch (error) {
        console.warn(`Failed to delete ${collectionName} in Firestore, deleting from localStorage.`, error);
      }
    }

    const items = getLocalList<T>(storageKey).filter((item) => item.id !== id);
    setLocalList(storageKey, items);
    invalidate();
  };

  return { list, getById, create, update, remove };
};

/* ---------- field mappers ---------- */

const asString = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value));
const asNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(asString) : [];

const mapWorkoutFields = (raw: Record<string, unknown>): Omit<WorkoutItem, 'id' | 'createdAt'> => {
  const level = Math.min(3, Math.max(1, asNumber(raw.level) || 1)) as WorkoutItem['level'];
  return {
    title: asString(raw.title),
    vi: asString(raw.vi),
    cover: asString(raw.cover),
    level,
    levelLabel: (asString(raw.levelLabel) || 'Dễ') as WorkoutItem['levelLabel'],
    duration: asNumber(raw.duration),
    kcal: asNumber(raw.kcal),
    focus: asString(raw.focus),
    blurb: asString(raw.blurb),
    tags: asStringArray(raw.tags),
    equipment: asStringArray(raw.equipment),
    steps: Array.isArray(raw.steps)
      ? raw.steps.map((step) => {
          const item = (step ?? {}) as Record<string, unknown>;
          return { name: asString(item.name), note: asString(item.note), val: asString(item.val), unit: asString(item.unit) };
        })
      : [],
  };
};

const mapRecipeFields = (raw: Record<string, unknown>): Omit<RecipeItem, 'id' | 'createdAt'> => ({
  title: asString(raw.title),
  vi: asString(raw.vi),
  cover: asString(raw.cover),
  meal: (asString(raw.meal) || 'Bữa sáng') as RecipeItem['meal'],
  time: asNumber(raw.time),
  servings: asNumber(raw.servings),
  kcal: asNumber(raw.kcal),
  protein: asString(raw.protein) || '—',
  blurb: asString(raw.blurb),
  tags: asStringArray(raw.tags),
  ingredients: Array.isArray(raw.ingredients)
    ? raw.ingredients.map((ingredient) => {
        const item = (ingredient ?? {}) as Record<string, unknown>;
        return { name: asString(item.name), amt: asString(item.amt) };
      })
    : [],
  steps: Array.isArray(raw.steps)
    ? raw.steps.map((step) => {
        const item = (step ?? {}) as Record<string, unknown>;
        return { name: asString(item.name), note: asString(item.note) };
      })
    : [],
});

const mapLinkFields = (raw: Record<string, unknown>): Omit<LinkItem, 'id' | 'createdAt'> => ({
  name: asString(raw.name),
  cat: (asString(raw.cat) || 'apparel') as LinkItem['cat'],
  shop: (asString(raw.shop) || 'shopee') as LinkItem['shop'],
  price: asString(raw.price),
  note: asString(raw.note),
  thumb: asString(raw.thumb),
  affiliateUrl: asString(raw.affiliateUrl) || '#',
});

/* ---------- public stores ---------- */

const workoutStore = createStore<WorkoutItem, import('../types/models').WorkoutInput>(
  'workouts',
  STORAGE_KEYS.workouts,
  mapWorkoutFields,
  SEED_WORKOUTS,
);

const recipeStore = createStore<RecipeItem, import('../types/models').RecipeInput>(
  'recipes',
  STORAGE_KEYS.recipes,
  mapRecipeFields,
  SEED_RECIPES,
);

const linkStore = createStore<LinkItem, import('../types/models').LinkInput>(
  'links',
  STORAGE_KEYS.links,
  mapLinkFields,
  SEED_LINKS,
);

export const listWorkouts = workoutStore.list;
export const getWorkoutById = workoutStore.getById;
export const createWorkout = workoutStore.create;
export const updateWorkout = workoutStore.update;
export const deleteWorkout = workoutStore.remove;

export const listRecipes = recipeStore.list;
export const getRecipeById = recipeStore.getById;
export const createRecipe = recipeStore.create;
export const updateRecipe = recipeStore.update;
export const deleteRecipe = recipeStore.remove;

export const listLinks = linkStore.list;
export const createLink = linkStore.create;
export const updateLink = linkStore.update;
export const deleteLink = linkStore.remove;

/* ---------- admin auth ---------- */

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
