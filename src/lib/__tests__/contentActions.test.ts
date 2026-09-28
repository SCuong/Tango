import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Lesson, QuizSessionResult, StudyBook } from '../../types';
import {
  createLesson,
  createStudyBook,
  deleteBookCascade,
  deleteLessonCascade,
  isValidTitle,
  removeBookCover,
  resolveBookDeletionScope,
  updateLessonMetadata,
  updateStudyBook,
} from '../contentActions';
import {
  deleteCoverBlob,
  getCoverBlob,
  loadBooks,
  loadHistory,
  loadLessons,
  loadProgress,
  saveBooks,
  saveCoverBlob,
  saveHistory,
  saveLessons,
  saveProgress,
} from '../storage';
import { isSupportedCoverFile, fitWithin, replaceBookCover } from '../coverImage';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
}

const now = new Date('2026-05-01T00:00:00.000Z');

function book(id: string, coverImageId?: string): StudyBook {
  return { id, title: id, coverImageId, createdAt: 'x', updatedAt: 'x' };
}

function lesson(id: string, bookId: string | undefined, itemIds: string[]): Lesson {
  return {
    id,
    bookId,
    category: 'kanji',
    title: id,
    items: itemIds.map((itemId) => ({ id: itemId, japanese: itemId, vietnamese: ['x'] })),
  };
}

function session(sessionId: string, lessonIds: string[], missedItemIds: string[] = []): QuizSessionResult {
  return {
    sessionId,
    lessonIds,
    mode: 'test',
    totalQuestions: 1,
    correctCount: 1,
    incorrectCount: 0,
    accuracy: 100,
    bestStreak: 1,
    timeSpentSeconds: 1,
    missedItemIds,
    completedAt: 'x',
  };
}

function progress(ids: string[]) {
  return Object.fromEntries(
    ids.map((id) => [id, { itemId: id, totalAttempts: 1, correctCount: 1, incorrectCount: 0, lastStudiedAt: 'x', isMarkedWeak: false }])
  );
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
  saveBooks({ b1: book('b1', 'cover_1'), b2: book('b2') });
  saveLessons({
    l1: lesson('l1', 'b1', ['i1', 'i2']),
    l2: lesson('l2', 'b1', ['i3']),
    l3: lesson('l3', 'b2', ['i4']),
    l4: lesson('l4', undefined, ['i5']),
  });
  saveProgress(progress(['i1', 'i2', 'i3', 'i4', 'i5']));
  saveHistory([
    session('s-b1', ['l1']),
    session('s-mixed', ['l3', 'l4'], ['i2']), // references a b1 item only through missedItemIds
    session('s-b2', ['l3']),
    session('s-free', ['l4']),
  ]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pure content helpers', () => {
  it('validates titles (required, whitespace-only rejected, duplicates allowed)', () => {
    expect(isValidTitle('  ')).toBe(false);
    expect(isValidTitle('中級へ行こう')).toBe(true);
    const a = createStudyBook(' 中級へ行こう ', undefined, now);
    const b = createStudyBook('中級へ行こう', undefined, now);
    expect(a.title).toBe('中級へ行こう');
    expect(a.id).not.toBe(b.id);
    expect(a.id.startsWith('book_')).toBe(true);
    expect(a.coverImageId).toBeUndefined();
  });

  it('renaming never changes the book id and can clear the cover', () => {
    const original = book('b1', 'cover_1');
    const renamed = updateStudyBook(original, { title: 'Mimikara' }, now);
    expect(renamed.id).toBe('b1');
    expect(renamed.coverImageId).toBe('cover_1');
    expect('coverImageId' in updateStudyBook(original, { coverImageId: undefined }, now)).toBe(false);
  });

  it('updating lesson metadata keeps lesson and item IDs', () => {
    const l = lesson('l1', 'b1', ['i1']);
    const moved = updateLessonMetadata(l, { title: ' New ', subtitle: '', category: 'vocabulary' });
    expect(moved.id).toBe('l1');
    expect(moved.items[0].id).toBe('i1');
    expect(moved.bookId).toBeUndefined();
    expect(moved.subtitle).toBeUndefined();
    expect(moved.category).toBe('vocabulary');
    expect(moved.title).toBe('New');
  });

  it('creates lessons with opaque item IDs', () => {
    const created = createLesson({ title: 'Bài 3', category: 'kanji', bookId: 'b2' }, [
      { japanese: '旅行', vietnamese: [] },
    ]);
    expect(created.id.startsWith('lesson_')).toBe(true);
    expect(created.items[0].id.startsWith('item_')).toBe(true);
    expect(created.bookId).toBe('b2');
  });

  it('resolves book deletion scope including history referenced only by missed items', () => {
    const scope = resolveBookDeletionScope('b1', loadBooks(), loadLessons(), loadHistory());
    expect(scope.coverImageId).toBe('cover_1');
    expect(scope.affectedLessonIds).toEqual(['l1', 'l2']);
    expect(scope.affectedStudyItemIds).toEqual(['i1', 'i2', 'i3']);
    expect(scope.affectedHistoryIds.sort()).toEqual(['s-b1', 's-mixed']);
  });
});

describe('hard-delete cascades', () => {
  it('deletes a book with its lessons, progress, history, and cover blob; book metadata last', async () => {
    await saveCoverBlob('cover_1', new Blob(['img']));
    const cleared: string[][] = [];
    const scope = await deleteBookCascade('b1', (s) => cleared.push(s.affectedLessonIds));
    expect(cleared).toEqual([['l1', 'l2']]);
    expect(scope.deletedBookId).toBe('b1');
    expect(Object.keys(loadBooks())).toEqual(['b2']);
    expect(Object.keys(loadLessons())).toEqual(['l3', 'l4']);
    expect(Object.keys(loadProgress()).sort()).toEqual(['i4', 'i5']);
    expect(loadHistory().map((h) => h.sessionId)).toEqual(['s-b2', 's-free']);
    expect(await getCoverBlob('cover_1')).toBeNull();
  });

  it('is idempotent when retried', async () => {
    await deleteBookCascade('b1');
    await deleteBookCascade('b1');
    expect(Object.keys(loadBooks())).toEqual(['b2']);
  });

  it('keeps the cover reference when the cover blob delete fails (retry-safe order)', async () => {
    const failingIndexedDb = { open: () => { throw new Error('idb down'); } };
    vi.stubGlobal('indexedDB', failingIndexedDb);
    await expect(deleteBookCascade('b1')).rejects.toThrow();
    // Book metadata (with coverImageId) and lessons are still there for a retry
    expect(loadBooks().b1.coverImageId).toBe('cover_1');
    expect(loadLessons().l1).toBeDefined();
  });

  it('deletes one lesson, its item progress and affected history, keeping the parent book', () => {
    deleteLessonCascade('l1');
    expect(loadLessons().l1).toBeUndefined();
    expect(loadLessons().l2).toBeDefined();
    expect(loadBooks().b1).toBeDefined();
    expect(Object.keys(loadProgress()).sort()).toEqual(['i3', 'i4', 'i5']);
    expect(loadHistory().map((h) => h.sessionId)).toEqual(['s-b2', 's-free']);
  });
});

async function listCoverIds(): Promise<string[]> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('tango_v1_covers_idb', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('covers');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
    const request = db.transaction('covers').objectStore('covers').getAllKeys();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return keys.map(String);
}

/** Makes every write to the books key fail (e.g. QuotaExceededError). */
function failBooksWrites() {
  const storage = localStorage as unknown as MemoryStorage;
  const original = storage.setItem.bind(storage);
  vi.spyOn(storage, 'setItem').mockImplementation((key: string, value: string) => {
    if (key === 'tango_v1_books') throw new Error('QuotaExceededError');
    original(key, value);
  });
}

describe('cover persistence failures', () => {
  beforeEach(async () => {
    for (const id of await listCoverIds()) await deleteCoverBlob(id);
  });

  it('replacing a cover deletes the new blob and keeps the old cover when metadata cannot be saved', async () => {
    await saveCoverBlob('cover_1', new Blob(['old']));
    failBooksWrites();
    await expect(replaceBookCover('b1', new Blob(['new']), now)).rejects.toThrow('QuotaExceededError');
    expect(loadBooks().b1.coverImageId).toBe('cover_1');
    expect(await getCoverBlob('cover_1')).not.toBeNull();
    expect(await listCoverIds()).toEqual(['cover_1']);
  });

  it('removing a cover restores the blob when clearing the metadata fails', async () => {
    await saveCoverBlob('cover_1', new Blob(['img']));
    failBooksWrites();
    await expect(removeBookCover('b1', now)).rejects.toThrow('QuotaExceededError');
    expect(loadBooks().b1.coverImageId).toBe('cover_1');
    const restored = await getCoverBlob('cover_1');
    expect(restored).not.toBeNull();
    expect(await restored!.text()).toBe('img');
  });

  it('a retried removal succeeds after a failure', async () => {
    await saveCoverBlob('cover_1', new Blob(['img']));
    failBooksWrites();
    await expect(removeBookCover('b1', now)).rejects.toThrow();
    vi.restoreAllMocks();
    await removeBookCover('b1', now);
    expect(loadBooks().b1.coverImageId).toBeUndefined();
    expect(await listCoverIds()).toEqual([]);
  });
});

describe('covers', () => {
  it('accepts only jpg, jpeg, png, webp', () => {
    expect(isSupportedCoverFile({ name: 'a.JPG', type: 'image/jpeg' })).toBe(true);
    expect(isSupportedCoverFile({ name: 'a.webp', type: '' })).toBe(true);
    expect(isSupportedCoverFile({ name: 'a.gif', type: 'image/gif' })).toBe(false);
    expect(isSupportedCoverFile({ name: 'a.png', type: 'text/plain' })).toBe(false);
  });

  it('fits large images inside the max edge keeping the ratio', () => {
    expect(fitWithin(1800, 2400, 900)).toEqual({ width: 675, height: 900 });
    expect(fitWithin(300, 400, 900)).toEqual({ width: 300, height: 400 });
  });

  it('removing a cover deletes the blob and clears only coverImageId', async () => {
    await saveCoverBlob('cover_1', new Blob(['img']));
    await removeBookCover('b1', now);
    expect(await getCoverBlob('cover_1')).toBeNull();
    expect(loadBooks().b1.coverImageId).toBeUndefined();
    expect(Object.keys(loadLessons())).toHaveLength(4);
    expect(loadHistory()).toHaveLength(4);
  });

  it('replacing a cover stores the new blob and deletes the old one', async () => {
    await saveCoverBlob('cover_1', new Blob(['old']));
    const updated = await replaceBookCover('b1', new Blob(['new']), now);
    expect(updated?.coverImageId).toBeDefined();
    expect(updated?.coverImageId).not.toBe('cover_1');
    expect(await getCoverBlob('cover_1')).toBeNull();
    expect(await getCoverBlob(updated!.coverImageId!)).not.toBeNull();
  });
});
