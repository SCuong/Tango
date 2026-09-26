/**
 * Tango — Client-Side Storage Layer
 *
 * Governed by:
 * - docs/ARCHITECTURE.md (§§4, 7)
 * - docs/DATA_MODEL.md (§4)
 * - docs/CONTENT_LIBRARY_SPEC.md (§§2, 5.3)
 */

import {
  StudyBook,
  Lesson,
  ItemProgress,
  QuizSessionResult,
  UserPreferences,
} from '../types';

/**
 * Exact canonical physical storage keys for localStorage.
 */
export const STORAGE_KEYS = {
  BOOKS: 'tango_v1_books',
  LESSONS: 'tango_v1_lessons',
  PROGRESS: 'tango_v1_progress',
  HISTORY: 'tango_v1_history',
  PREFERENCES: 'tango_v1_preferences',
  LIBRARY_INIT: 'tango_v1_library_init',
} as const;

/**
 * Canonical configuration for IndexedDB cover store.
 */
export const IDB_CONFIG = {
  DB_NAME: 'tango_v1_covers_idb',
  STORE_NAME: 'covers',
  VERSION: 1,
} as const;

/**
 * Authoritative default user preferences.
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  language: 'vi',
  soundEnabled: false,
};

/**
 * Safe localStorage read. Returns null if key does not exist,
 * or if localStorage is unavailable. Does not throw on read.
 */
function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to read from localStorage key "${key}":`, error);
    return null;
  }
}

/**
 * Writes a string value to localStorage.
 * Throws QuotaExceededError or write errors directly so callers/UI can surface failures.
 */
function setStorageItem(key: string, value: string): void {
  if (typeof localStorage === 'undefined') {
    throw new Error('localStorage is not available in this environment');
  }
  localStorage.setItem(key, value);
}

/**
 * Safely parses JSON string with fallback default value.
 * Invalid JSON logs a warning and returns fallback without crashing application startup.
 */
function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (raw === null || raw === undefined || raw === '') {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error('Failed to parse JSON from storage:', error);
    return fallback;
  }
}

/* ==========================================================================
   LocalStorage Typed Operations
   ========================================================================== */

/**
 * Loads StudyBooks metadata from tango_v1_books.
 * Returns empty map {} if uninitialized or malformed.
 */
export function loadBooks(): Record<string, StudyBook> {
  const data = safeJsonParse<unknown>(safeGetItem(STORAGE_KEYS.BOOKS), {});
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, StudyBook>;
  }
  return {};
}

/**
 * Persists StudyBooks metadata map to tango_v1_books.
 * Write failures propagate to allow UI error surfacing.
 */
export function saveBooks(books: Record<string, StudyBook>): void {
  setStorageItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
}

/**
 * Loads canonical mutable lessons from tango_v1_lessons.
 * Returns empty map {} if uninitialized or malformed.
 */
export function loadLessons(): Record<string, Lesson> {
  const data = safeJsonParse<unknown>(safeGetItem(STORAGE_KEYS.LESSONS), {});
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, Lesson>;
  }
  return {};
}

/**
 * Persists canonical mutable lessons map to tango_v1_lessons.
 * Write failures propagate to allow UI error surfacing.
 */
export function saveLessons(lessons: Record<string, Lesson>): void {
  setStorageItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
}

/**
 * Loads item progress records from tango_v1_progress.
 * Returns empty map {} if uninitialized or malformed.
 */
export function loadProgress(): Record<string, ItemProgress> {
  const data = safeJsonParse<unknown>(safeGetItem(STORAGE_KEYS.PROGRESS), {});
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, ItemProgress>;
  }
  return {};
}

/**
 * Persists item progress records map to tango_v1_progress.
 * Write failures propagate to allow UI error surfacing.
 */
export function saveProgress(progress: Record<string, ItemProgress>): void {
  setStorageItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
}

/**
 * Loads quiz session history from tango_v1_history.
 * Returns empty array [] if uninitialized or malformed.
 */
export function loadHistory(): QuizSessionResult[] {
  const data = safeJsonParse<unknown>(safeGetItem(STORAGE_KEYS.HISTORY), []);
  if (Array.isArray(data)) {
    return data as QuizSessionResult[];
  }
  return [];
}

/**
 * Persists quiz session history to tango_v1_history.
 * Write failures propagate to allow UI error surfacing.
 */
export function saveHistory(history: QuizSessionResult[]): void {
  setStorageItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
}

/**
 * Loads user preferences from tango_v1_preferences.
 * Falls back safely to default preferences on missing or malformed data.
 */
export function loadPreferences(): UserPreferences {
  const data = safeJsonParse<Partial<UserPreferences> | null>(
    safeGetItem(STORAGE_KEYS.PREFERENCES),
    null
  );

  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_PREFERENCES };
  }

  return {
    theme:
      data.theme === 'dark' || data.theme === 'sakura'
        ? data.theme
        : DEFAULT_PREFERENCES.theme,
    language: data.language === 'en' ? 'en' : DEFAULT_PREFERENCES.language,
    soundEnabled:
      typeof data.soundEnabled === 'boolean'
        ? data.soundEnabled
        : DEFAULT_PREFERENCES.soundEnabled,
  };
}

/**
 * Persists user preferences to tango_v1_preferences.
 * Write failures propagate to allow UI error surfacing.
 */
export function savePreferences(preferences: UserPreferences): void {
  setStorageItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
}

/**
 * Checks if the seed library has been initialized in localStorage.
 */
export function isLibraryInitialized(): boolean {
  return safeGetItem(STORAGE_KEYS.LIBRARY_INIT) === 'true';
}

/**
 * Sets the library initialization marker in localStorage.
 * Should ONLY be called after seed lessons have successfully persisted.
 */
export function setLibraryInitialized(): void {
  setStorageItem(STORAGE_KEYS.LIBRARY_INIT, 'true');
}

/* ==========================================================================
   IndexedDB Native Cover Blob Store (tango_v1_covers_idb)
   ========================================================================== */

/**
 * Opens native IndexedDB database connection for cover Blob storage.
 */
function openCoversDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = indexedDB.open(IDB_CONFIG.DB_NAME, IDB_CONFIG.VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_CONFIG.STORE_NAME)) {
        db.createObjectStore(IDB_CONFIG.STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open covers IndexedDB'));
    };
  });
}

/**
 * Saves binary book cover Blob to IndexedDB keyed by coverImageId.
 * Out-of-line key storage prevents base64 localStorage bloating.
 * Resolves ONLY when transaction.oncomplete fires to guarantee commit,
 * and always closes the IDBDatabase connection.
 */
export async function saveCoverBlob(coverImageId: string, blob: Blob): Promise<void> {
  if (!coverImageId) {
    throw new Error('coverImageId is required');
  }
  const db = await openCoversDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(IDB_CONFIG.STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_CONFIG.STORE_NAME);
      const request = store.put(blob, coverImageId);

      let settled = false;
      const cleanupAndReject = (error: unknown) => {
        if (!settled) {
          settled = true;
          db.close();
          reject(error);
        }
      };

      request.onerror = () => {
        cleanupAndReject(request.error || new Error('Failed to save cover blob'));
      };

      tx.oncomplete = () => {
        if (!settled) {
          settled = true;
          db.close();
          resolve();
        }
      };

      tx.onerror = () => {
        cleanupAndReject(tx.error || new Error('Failed to save cover blob'));
      };

      tx.onabort = () => {
        cleanupAndReject(tx.error || new Error('IndexedDB transaction aborted'));
      };
    } catch (err) {
      db.close();
      reject(err);
    }
  });
}

/**
 * Retrieves binary book cover Blob from IndexedDB by coverImageId.
 * Returns null if the cover does not exist or coverImageId is empty.
 * Always closes the IDBDatabase connection upon completion or failure.
 */
export async function getCoverBlob(coverImageId: string): Promise<Blob | null> {
  if (!coverImageId) {
    return null;
  }
  const db = await openCoversDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(IDB_CONFIG.STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_CONFIG.STORE_NAME);
      const request = store.get(coverImageId);

      let settled = false;
      let result: Blob | null = null;

      request.onsuccess = () => {
        result = (request.result as Blob) || null;
      };

      request.onerror = () => {
        if (!settled) {
          settled = true;
          db.close();
          reject(request.error || new Error('Failed to retrieve cover blob'));
        }
      };

      tx.oncomplete = () => {
        if (!settled) {
          settled = true;
          db.close();
          resolve(result);
        }
      };

      tx.onerror = () => {
        if (!settled) {
          settled = true;
          db.close();
          reject(tx.error || new Error('Failed to retrieve cover blob'));
        }
      };

      tx.onabort = () => {
        if (!settled) {
          settled = true;
          db.close();
          reject(tx.error || new Error('IndexedDB transaction aborted'));
        }
      };
    } catch (err) {
      db.close();
      reject(err);
    }
  });
}

/**
 * Deletes binary book cover Blob from IndexedDB by coverImageId.
 * Idempotent: succeeds whether the key exists or not.
 * Resolves on transaction.oncomplete and always closes IDBDatabase connection.
 */
export async function deleteCoverBlob(coverImageId: string): Promise<void> {
  if (!coverImageId) {
    return;
  }
  const db = await openCoversDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(IDB_CONFIG.STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_CONFIG.STORE_NAME);
      const request = store.delete(coverImageId);

      let settled = false;
      const cleanupAndReject = (error: unknown) => {
        if (!settled) {
          settled = true;
          db.close();
          reject(error);
        }
      };

      request.onerror = () => {
        cleanupAndReject(request.error || new Error('Failed to delete cover blob'));
      };

      tx.oncomplete = () => {
        if (!settled) {
          settled = true;
          db.close();
          resolve();
        }
      };

      tx.onerror = () => {
        cleanupAndReject(tx.error || new Error('Failed to delete cover blob'));
      };

      tx.onabort = () => {
        cleanupAndReject(tx.error || new Error('IndexedDB transaction aborted'));
      };
    } catch (err) {
      db.close();
      reject(err);
    }
  });
}
