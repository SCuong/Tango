import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  APP_STATE_VERSION,
  loadUserStudyState,
  bootstrapAppState,
  mergePreferences,
  applyDocumentPreferences,
} from '../appState';
import {
  STORAGE_KEYS,
  saveBooks,
  saveLessons,
  saveProgress,
  saveHistory,
  savePreferences,
  isLibraryInitialized,
} from '../storage';
import {
  StudyBook,
  Lesson,
  ItemProgress,
  QuizSessionResult,
  UserPreferences,
} from '../../types';

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

const mockSeedLessons: Lesson[] = [
  {
    id: 'seed-vocab-01',
    category: 'vocabulary',
    title: 'Bài 1 Từ vựng',
    items: [
      {
        id: 'seed-item-1',
        japanese: '旅行',
        kana: 'りょこう',
        vietnamese: ['du lịch'],
      },
    ],
  },
  {
    id: 'seed-kanji-01',
    category: 'kanji',
    title: 'Bài 1 Kanji',
    items: [
      {
        id: 'seed-item-2',
        japanese: '行動',
        kana: 'こうどう',
        hanViet: 'HÀNH ĐỘNG',
        vietnamese: ['hành động'],
      },
    ],
  },
];

describe('src/lib/appState.ts (Bootstrap & State Aggregation Layer)', () => {
  beforeEach(() => {
    const mockStorage = new LocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('schema version and default state', () => {
    it('exposes explicit current app-state schema version of 1', () => {
      expect(APP_STATE_VERSION).toBe(1);
    });

    it('returns valid UserStudyState with default preferences and empty stores when storage is unpopulated', () => {
      const state = loadUserStudyState();

      expect(state).toEqual({
        version: 1,
        preferences: {
          theme: 'light',
          language: 'vi',
          soundEnabled: false,
        },
        books: {},
        lessons: {},
        progressByItem: {},
        recentResults: [],
      });
    });
  });

  describe('aggregating partitioned persistence stores', () => {
    it('assembles partitioned persisted data into the unified UserStudyState model', () => {
      const books: Record<string, StudyBook> = {
        book_minna: {
          id: 'book_minna',
          title: 'Minna no Nihongo I',
          createdAt: '2026-09-27T00:00:00.000Z',
          updatedAt: '2026-09-27T00:00:00.000Z',
        },
      };

      const lessons: Record<string, Lesson> = {
        'seed-vocab-01': mockSeedLessons[0],
      };

      const progress: Record<string, ItemProgress> = {
        'seed-item-1': {
          itemId: 'seed-item-1',
          totalAttempts: 3,
          correctCount: 2,
          incorrectCount: 1,
          lastStudiedAt: '2026-09-27T01:00:00.000Z',
          isMarkedWeak: false,
        },
      };

      const history: QuizSessionResult[] = [
        {
          sessionId: 'session_001',
          lessonIds: ['seed-vocab-01'],
          mode: 'test',
          totalQuestions: 1,
          correctCount: 1,
          incorrectCount: 0,
          accuracy: 100,
          bestStreak: 1,
          timeSpentSeconds: 12,
          missedItemIds: [],
          completedAt: '2026-09-27T01:00:00.000Z',
        },
      ];

      const preferences: UserPreferences = {
        theme: 'sakura',
        language: 'en',
        soundEnabled: true,
      };

      saveBooks(books);
      saveLessons(lessons);
      saveProgress(progress);
      saveHistory(history);
      savePreferences(preferences);

      const aggregatedState = loadUserStudyState();

      expect(aggregatedState).toEqual({
        version: 1,
        preferences,
        books,
        lessons,
        progressByItem: progress,
        recentResults: history,
      });
    });

    it('resiliently handles corrupted JSON in individual partition keys without crashing', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      localStorage.setItem(STORAGE_KEYS.BOOKS, 'broken');
      localStorage.setItem(STORAGE_KEYS.LESSONS, '{corrupt:');
      localStorage.setItem(STORAGE_KEYS.PROGRESS, 'invalid');
      localStorage.setItem(STORAGE_KEYS.HISTORY, 'not json');
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, 'null');

      const state = loadUserStudyState();

      expect(state.version).toBe(1);
      expect(state.books).toEqual({});
      expect(state.lessons).toEqual({});
      expect(state.progressByItem).toEqual({});
      expect(state.recentResults).toEqual([]);
      expect(state.preferences).toEqual({
        theme: 'light',
        language: 'vi',
        soundEnabled: false,
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('bootstrapAppState lifecycle and seed handling', () => {
    it('executes seed initialization before loading lesson snapshot into runtime state', () => {
      expect(isLibraryInitialized()).toBe(false);

      const bootstrapped = bootstrapAppState(mockSeedLessons);

      expect(bootstrapped.version).toBe(1);
      expect(isLibraryInitialized()).toBe(true);
      expect(Object.keys(bootstrapped.lessons)).toHaveLength(2);
      expect(bootstrapped.lessons['seed-vocab-01']).toEqual(mockSeedLessons[0]);
      expect(bootstrapped.lessons['seed-kanji-01']).toEqual(mockSeedLessons[1]);
    });

    it('does not re-seed or resurrect deleted lessons when library is already initialized', () => {
      // 1. Initial bootstrap
      bootstrapAppState(mockSeedLessons);
      expect(isLibraryInitialized()).toBe(true);

      // 2. User deletes a lesson
      const mutableLessons = { ...loadUserStudyState().lessons };
      delete mutableLessons['seed-vocab-01'];
      saveLessons(mutableLessons);

      // Verify deletion persisted
      expect(loadUserStudyState().lessons['seed-vocab-01']).toBeUndefined();

      // 3. Re-running bootstrap with the seed list must NOT resurrect deleted lesson
      const secondBootstrapped = bootstrapAppState(mockSeedLessons);

      expect(secondBootstrapped.lessons['seed-vocab-01']).toBeUndefined();
      expect(secondBootstrapped.lessons['seed-kanji-01']).toEqual(mockSeedLessons[1]);
    });

    it('does not overwrite user-created lessons when bootstrap runs', () => {
      const customLesson: Lesson = {
        id: 'custom-lesson-1',
        category: 'vocabulary',
        title: 'User Custom Lesson',
        items: [],
      };

      saveLessons({ [customLesson.id]: customLesson });

      const state = bootstrapAppState(mockSeedLessons);

      expect(state.lessons['custom-lesson-1']).toEqual(customLesson);
      expect(state.lessons['seed-vocab-01']).toEqual(mockSeedLessons[0]);
      expect(state.lessons['seed-kanji-01']).toEqual(mockSeedLessons[1]);
    });
  });

  describe('mergePreferences utility', () => {
    const base: UserPreferences = {
      theme: 'light',
      language: 'vi',
      soundEnabled: false,
    };

    it('merges partial preference changes cleanly', () => {
      expect(mergePreferences(base, { theme: 'dark' })).toEqual({
        theme: 'dark',
        language: 'vi',
        soundEnabled: false,
      });

      expect(mergePreferences(base, { language: 'en', soundEnabled: true })).toEqual({
        theme: 'light',
        language: 'en',
        soundEnabled: true,
      });
    });

    it('preserves current theme and language when unknown values are supplied in patch', () => {
      // @ts-expect-error Testing invalid runtime input
      const merged = mergePreferences(base, { theme: 'neon', language: 'fr' });
      expect(merged.theme).toBe('light');
      expect(merged.language).toBe('vi');
    });
  });

  describe('applyDocumentPreferences (DOM synchronization)', () => {
    it('synchronizes theme dataset and lang attributes on document root element', () => {
      const mockDocumentElement = {
        dataset: {} as Record<string, string>,
        lang: '',
        setAttribute(name: string, value: string) {
          if (name === 'data-theme') {
            this.dataset.theme = value;
          }
        },
      };

      vi.stubGlobal('document', {
        documentElement: mockDocumentElement,
      });

      applyDocumentPreferences({ theme: 'dark', language: 'en' });
      expect(mockDocumentElement.dataset.theme).toBe('dark');
      expect(mockDocumentElement.lang).toBe('en');

      applyDocumentPreferences({ theme: 'sakura', language: 'vi' });
      expect(mockDocumentElement.dataset.theme).toBe('sakura');
      expect(mockDocumentElement.lang).toBe('vi');
    });

    it('falls back to safe defaults (light / vi) for invalid values during document sync', () => {
      const mockDocumentElement = {
        dataset: {} as Record<string, string>,
        lang: '',
        setAttribute(name: string, value: string) {
          if (name === 'data-theme') {
            this.dataset.theme = value;
          }
        },
      };

      vi.stubGlobal('document', {
        documentElement: mockDocumentElement,
      });

      // @ts-expect-error Testing invalid runtime values
      applyDocumentPreferences({ theme: 'unknown_theme', language: 'es' });
      expect(mockDocumentElement.dataset.theme).toBe('light');
      expect(mockDocumentElement.lang).toBe('vi');
    });

    it('executes safely without throwing when document is undefined (Node/SSR)', () => {
      // In default Node environment, global document is undefined
      expect(() =>
        applyDocumentPreferences({ theme: 'dark', language: 'en' })
      ).not.toThrow();
    });
  });
});
