import { describe, it, expect } from 'vitest';
import { Lesson, StudyBook } from '../../types';
import {
  getBookLessons,
  getLessonIdsContainingItems,
  getUnassignedLessons,
  getWeakItemIds,
  groupLessonsByBook,
} from '../studySelectors';

const books: Record<string, StudyBook> = {
  b1: { id: 'b1', title: 'A', createdAt: 'x', updatedAt: 'x' },
  b2: { id: 'b2', title: 'B', createdAt: 'x', updatedAt: 'x' },
};

const l = (id: string, bookId: string | undefined, category: Lesson['category'], itemIds: string[]): Lesson => ({
  id,
  bookId,
  category,
  title: id,
  items: itemIds.map((itemId) => ({ id: itemId, japanese: itemId, vietnamese: [] })),
});

const lessons: Record<string, Lesson> = {
  u1: l('u1', undefined, 'kanji', ['x1']),
  a1: l('a1', 'b1', 'kanji', ['x2', 'x3']),
  a2: l('a2', 'b1', 'vocabulary', ['x4']),
  o1: l('o1', 'gone', 'kanji', ['x5']), // parent book no longer exists
  b3: l('b3', 'b2', 'kanji', ['x6']),
};

describe('studySelectors', () => {
  it('filters lessons by book and category in library order', () => {
    expect(getBookLessons(lessons, 'b1').map((x) => x.id)).toEqual(['a1', 'a2']);
    expect(getBookLessons(lessons, 'b1', 'kanji').map((x) => x.id)).toEqual(['a1']);
  });

  it('treats missing or dangling bookIds as unassigned', () => {
    expect(getUnassignedLessons(lessons, books).map((x) => x.id)).toEqual(['u1', 'o1']);
  });

  it('groups by book in library order with Unassigned last, omitting empty groups', () => {
    const groups = groupLessonsByBook(lessons, books, 'kanji');
    expect(groups.map((g) => g.book?.id ?? 'unassigned')).toEqual(['b1', 'b2', 'unassigned']);
    expect(groupLessonsByBook(lessons, books, 'vocabulary').map((g) => g.book?.id)).toEqual(['b1']);
  });

  it('collects weak items and the lessons that contain them', () => {
    const progress = {
      x3: { itemId: 'x3', totalAttempts: 1, correctCount: 0, incorrectCount: 1, lastStudiedAt: 'x', isMarkedWeak: true },
      x4: { itemId: 'x4', totalAttempts: 1, correctCount: 1, incorrectCount: 0, lastStudiedAt: 'x', isMarkedWeak: false },
    };
    expect(getWeakItemIds([lessons.a1, lessons.a2], progress)).toEqual(['x3']);
    expect(getLessonIdsContainingItems(lessons, ['x3', 'x6'])).toEqual(['a1', 'b3']);
  });
});
