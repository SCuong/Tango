import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  STORAGE_KEYS,
  IDB_CONFIG,
  DEFAULT_PREFERENCES,
  loadBooks,
  saveBooks,
  loadLessons,
  saveLessons,
  loadProgress,
  saveProgress,
  loadHistory,
  saveHistory,
  loadPreferences,
  savePreferences,
  isLibraryInitialized,
  setLibraryInitialized,
  saveCoverBlob,
  getCoverBlob,
  deleteCoverBlob,
} from '../storage';
import { StudyBook, Lesson, ItemProgress, QuizSessionResult } from '../../types';

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

describe('storage.ts', () => {
  beforeEach(() => {
    const mockStorage = new LocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
  });

  describe('canonical localStorage defaults', () => {
    it('returns empty canonical data structures when storage is unpopulated', () => {
      expect(loadBooks()).toEqual({});
      expect(loadLessons()).toEqual({});
      expect(loadProgress()).toEqual({});
      expect(loadHistory()).toEqual([]);
      expect(isLibraryInitialized()).toBe(false);
    });

    it('returns authoritative default user preferences', () => {
      expect(DEFAULT_PREFERENCES).toEqual({
        theme: 'light',
        language: 'vi',
        soundEnabled: false,
      });
      expect(loadPreferences()).toEqual({
        theme: 'light',
        language: 'vi',
        soundEnabled: false,
      });
    });
  });

  describe('read/write round trips', () => {
    it('saves and loads StudyBooks', () => {
      const books: Record<string, StudyBook> = {
        book_1: {
          id: 'book_1',
          title: '中級へ行こう',
          coverImageId: 'cover_1',
          createdAt: '2026-09-26T00:00:00.000Z',
          updatedAt: '2026-09-26T00:00:00.000Z',
        },
      };

      saveBooks(books);
      expect(loadBooks()).toEqual(books);
      expect(localStorage.getItem(STORAGE_KEYS.BOOKS)).toBe(JSON.stringify(books));
    });

    it('saves and loads Lessons in canonical mutable tango_v1_lessons', () => {
      const lessons: Record<string, Lesson> = {
        'vocab-01': {
          id: 'vocab-01',
          bookId: 'book_1',
          category: 'vocabulary',
          title: 'Bài 1',
          items: [
            {
              id: 'item-1',
              japanese: '旅行',
              kana: 'りょこう',
              vietnamese: ['du lịch'],
            },
          ],
        },
      };

      saveLessons(lessons);
      expect(loadLessons()).toEqual(lessons);
      expect(localStorage.getItem(STORAGE_KEYS.LESSONS)).toBe(JSON.stringify(lessons));
    });

    it('saves and loads ItemProgress', () => {
      const progress: Record<string, ItemProgress> = {
        'item-1': {
          itemId: 'item-1',
          totalAttempts: 5,
          correctCount: 4,
          incorrectCount: 1,
          lastMistakeAt: '2026-09-26T12:00:00.000Z',
          lastStudiedAt: '2026-09-26T12:05:00.000Z',
          isMarkedWeak: false,
        },
      };

      saveProgress(progress);
      expect(loadProgress()).toEqual(progress);
    });

    it('saves and loads QuizSessionResult history', () => {
      const history: QuizSessionResult[] = [
        {
          sessionId: 'session-1',
          lessonIds: ['vocab-01'],
          mode: 'test',
          totalQuestions: 10,
          correctCount: 9,
          incorrectCount: 1,
          accuracy: 90,
          bestStreak: 7,
          timeSpentSeconds: 45,
          missedItemIds: ['item-1'],
          completedAt: '2026-09-26T12:10:00.000Z',
        },
      ];

      saveHistory(history);
      expect(loadHistory()).toEqual(history);
    });

    it('saves and loads UserPreferences, validating themes and languages', () => {
      savePreferences({
        theme: 'sakura',
        language: 'en',
        soundEnabled: true,
      });

      expect(loadPreferences()).toEqual({
        theme: 'sakura',
        language: 'en',
        soundEnabled: true,
      });

      // Partial / invalid values safely sanitize back to defaults
      localStorage.setItem(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify({ theme: 'unknown', language: 'fr' })
      );
      expect(loadPreferences()).toEqual({
        theme: 'light',
        language: 'vi',
        soundEnabled: false,
      });
    });

    it('marks library initialized', () => {
      expect(isLibraryInitialized()).toBe(false);
      setLibraryInitialized();
      expect(isLibraryInitialized()).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.LIBRARY_INIT)).toBe('true');
    });
  });

  describe('error handling & resilience', () => {
    it('does not crash application startup on malformed JSON and returns defaults', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      localStorage.setItem(STORAGE_KEYS.BOOKS, 'broken JSON string {[[}');
      localStorage.setItem(STORAGE_KEYS.LESSONS, 'not json at all');
      localStorage.setItem(STORAGE_KEYS.PROGRESS, '}{');
      localStorage.setItem(STORAGE_KEYS.HISTORY, '{"not": "an array"}');
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, 'invalid');

      expect(() => loadBooks()).not.toThrow();
      expect(loadBooks()).toEqual({});

      expect(() => loadLessons()).not.toThrow();
      expect(loadLessons()).toEqual({});

      expect(() => loadProgress()).not.toThrow();
      expect(loadProgress()).toEqual({});

      expect(() => loadHistory()).not.toThrow();
      expect(loadHistory()).toEqual([]);

      expect(() => loadPreferences()).not.toThrow();
      expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);

      consoleErrorSpy.mockRestore();
    });

    it('allows write/quota errors to propagate so UI can handle storage exhaustion', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      expect(() => saveBooks({})).toThrow('QuotaExceededError');
      expect(() => saveLessons({})).toThrow('QuotaExceededError');
      expect(() => savePreferences(DEFAULT_PREFERENCES)).toThrow('QuotaExceededError');
    });
  });

  describe('IndexedDB Cover Store (tango_v1_covers_idb)', () => {
    it('matches authoritative database and store name contract', () => {
      expect(IDB_CONFIG.DB_NAME).toBe('tango_v1_covers_idb');
      expect(IDB_CONFIG.STORE_NAME).toBe('covers');
      expect(IDB_CONFIG.VERSION).toBe(1);
    });

    it('stores, retrieves, and deletes binary cover Blobs', async () => {
      const coverId = 'cover_uuid_123';
      const sampleBlob = new Blob(['sample-image-binary-data'], { type: 'image/png' });

      // Initially non-existent
      const initial = await getCoverBlob(coverId);
      expect(initial).toBeNull();

      // Save blob
      await saveCoverBlob(coverId, sampleBlob);

      // Retrieve blob
      const retrieved = await getCoverBlob(coverId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.size).toBe(sampleBlob.size);
      expect(retrieved?.type).toBe('image/png');

      const text = await retrieved?.text();
      expect(text).toBe('sample-image-binary-data');

      // Delete blob
      await deleteCoverBlob(coverId);

      // Verify removal
      const afterDelete = await getCoverBlob(coverId);
      expect(afterDelete).toBeNull();
    });

    it('handles empty or missing keys gracefully in IndexedDB operations', async () => {
      expect(await getCoverBlob('')).toBeNull();
      await expect(deleteCoverBlob('')).resolves.toBeUndefined();
      await expect(saveCoverBlob('', new Blob([]))).rejects.toThrow('coverImageId is required');
    });

    it('closes the IDBDatabase connection on saveCoverBlob, getCoverBlob, and deleteCoverBlob', async () => {
      const closeSpy = vi.spyOn(IDBDatabase.prototype, 'close');

      const coverId = 'cover_connection_cleanup_test';
      const sampleBlob = new Blob(['lifecycle-data'], { type: 'image/webp' });

      // Save operation
      await saveCoverBlob(coverId, sampleBlob);
      expect(closeSpy).toHaveBeenCalledTimes(1);

      // Get operation
      const retrieved = await getCoverBlob(coverId);
      expect(retrieved).not.toBeNull();
      expect(closeSpy).toHaveBeenCalledTimes(2);

      // Delete operation
      await deleteCoverBlob(coverId);
      expect(closeSpy).toHaveBeenCalledTimes(3);

      closeSpy.mockRestore();
    });

    it('closes the IDBDatabase connection and rejects if transaction aborts', async () => {
      const closeSpy = vi.spyOn(IDBDatabase.prototype, 'close');

      const txSpy = vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(function (
        this: IDBDatabase,
        ...args: Parameters<IDBDatabase['transaction']>
      ) {
        const tx = IDBDatabase.prototype.transaction.apply(this, args);
        queueMicrotask(() => {
          tx.abort();
        });
        return tx;
      });

      await expect(
        saveCoverBlob('abort_cover', new Blob(['data'], { type: 'image/png' }))
      ).rejects.toThrow();

      expect(closeSpy).toHaveBeenCalled();

      txSpy.mockRestore();
      closeSpy.mockRestore();
    });
  });
});
