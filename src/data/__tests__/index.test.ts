import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSeedLessons, initializeLibrary } from '../index';
import {
  STORAGE_KEYS,
  loadLessons,
  saveLessons,
  isLibraryInitialized,
} from '../../lib/storage';
import { Lesson } from '../../types';

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
    title: 'Bài 1',
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

describe('src/data/index.ts (Seed Initialization Pipeline)', () => {
  beforeEach(() => {
    const mockStorage = new LocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
  });

  it('production seed registry is currently empty pending approved curriculum data', () => {
    expect(getSeedLessons()).toEqual([]);
  });

  it('empty seed registry does not permanently lock out future initialization', () => {
    // 1. Initial run with empty seed lessons list
    const result1 = initializeLibrary([]);
    expect(result1).toBe(false);
    // Marker must NOT be written when registry is empty
    expect(isLibraryInitialized()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.LIBRARY_INIT)).toBeNull();

    // 2. Future run when approved seed lessons are supplied
    const result2 = initializeLibrary(mockSeedLessons);
    expect(result2).toBe(true);
    expect(isLibraryInitialized()).toBe(true);
    expect(loadLessons()).toEqual({
      'seed-vocab-01': mockSeedLessons[0],
      'seed-kanji-01': mockSeedLessons[1],
    });
  });

  it('first seed initialization copies seed lessons into tango_v1_lessons', () => {
    const result = initializeLibrary(mockSeedLessons);
    expect(result).toBe(true);

    const lessons = loadLessons();
    expect(Object.keys(lessons)).toHaveLength(2);
    expect(lessons['seed-vocab-01']).toEqual(mockSeedLessons[0]);
    expect(lessons['seed-kanji-01']).toEqual(mockSeedLessons[1]);
    expect(isLibraryInitialized()).toBe(true);
  });

  it('initialization marker prevents a second seed copy on subsequent startups', () => {
    // First run
    expect(initializeLibrary(mockSeedLessons)).toBe(true);

    // Second run with additional/different seed lessons
    const additionalSeed: Lesson[] = [
      {
        id: 'seed-extra',
        category: 'vocabulary',
        title: 'Extra',
        items: [],
      },
    ];

    const secondRunResult = initializeLibrary(additionalSeed);
    expect(secondRunResult).toBe(false);

    // Extra seed must NOT have been copied
    const lessons = loadLessons();
    expect(lessons['seed-extra']).toBeUndefined();
    expect(Object.keys(lessons)).toHaveLength(2);
  });

  it('deleting a seeded runtime lesson and running initialization again does NOT resurrect it', () => {
    // 1. First initialization
    initializeLibrary(mockSeedLessons);
    expect(loadLessons()['seed-vocab-01']).toBeDefined();

    // 2. User permanently deletes the lesson from runtime store
    const mutableLessons = loadLessons();
    delete mutableLessons['seed-vocab-01'];
    saveLessons(mutableLessons);

    expect(loadLessons()['seed-vocab-01']).toBeUndefined();

    // 3. User relaunches app / re-runs initialization
    const rerunResult = initializeLibrary(mockSeedLessons);
    expect(rerunResult).toBe(false);

    // Deleted lesson must NEVER be resurrected
    expect(loadLessons()['seed-vocab-01']).toBeUndefined();
  });

  it('initialization marker is not written before successful seed persistence', () => {
    // Mock saveLessons to simulate storage write failure (e.g. QuotaExceededError)
    vi.spyOn(localStorage, 'setItem').mockImplementation((key) => {
      if (key === STORAGE_KEYS.LESSONS) {
        throw new Error('QuotaExceededError');
      }
    });

    expect(() => initializeLibrary(mockSeedLessons)).toThrow('QuotaExceededError');

    // Because lesson persistence failed, marker must NOT be set
    expect(isLibraryInitialized()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.LIBRARY_INIT)).toBeNull();
  });

  it('preserves existing user-created lessons when later first seed initialization occurs', () => {
    // 1. User previously created or imported a lesson while seed registry was empty
    const userLesson: Lesson = {
      id: 'user-custom-01',
      category: 'vocabulary',
      title: 'Bài tự tạo',
      items: [
        {
          id: 'user-item-1',
          japanese: '勉強',
          kana: 'べんきょう',
          vietnamese: ['học tập'],
        },
      ],
    };

    saveLessons({ [userLesson.id]: userLesson });
    expect(isLibraryInitialized()).toBe(false);

    // 2. Later, approved seed content is bundled and first initialization runs
    const initResult = initializeLibrary(mockSeedLessons);
    expect(initResult).toBe(true);
    expect(isLibraryInitialized()).toBe(true);

    // 3. User's existing lesson is preserved alongside newly added seed lessons
    const lessons = loadLessons();
    expect(lessons['user-custom-01']).toEqual(userLesson);
    expect(lessons['seed-vocab-01']).toEqual(mockSeedLessons[0]);
    expect(lessons['seed-kanji-01']).toEqual(mockSeedLessons[1]);
    expect(Object.keys(lessons)).toHaveLength(3);
  });
});
