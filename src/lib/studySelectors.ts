/**
 * Tango — Pure Study Browsing Selectors
 *
 * Governed by:
 * - docs/CONTENT_LIBRARY_SPEC.md (§§1, 4, 8, 11)
 * - docs/screens/STUDY_SCREENS.md
 *
 * Library order is the insertion order of the canonical stores (`tango_v1_books`,
 * `tango_v1_lessons`); no screen reorders content.
 */

import { Lesson, StudyBook, StudyCategory, ItemProgress } from '../types';

export const STUDY_CATEGORIES: StudyCategory[] = ['vocabulary', 'kanji'];

export function getBookLessons(
  lessons: Record<string, Lesson>,
  bookId: string,
  category?: StudyCategory
): Lesson[] {
  return Object.values(lessons).filter(
    (lesson) => lesson.bookId === bookId && (category === undefined || lesson.category === category)
  );
}

/** Lessons whose `bookId` is missing or points to a book that no longer exists. */
export function isUnassignedLesson(lesson: Lesson, books: Record<string, StudyBook>): boolean {
  return !lesson.bookId || !books[lesson.bookId];
}

export function getUnassignedLessons(
  lessons: Record<string, Lesson>,
  books: Record<string, StudyBook>,
  category?: StudyCategory
): Lesson[] {
  return Object.values(lessons).filter(
    (lesson) =>
      isUnassignedLesson(lesson, books) && (category === undefined || lesson.category === category)
  );
}

export interface LessonGroup {
  /** `null` is the neutral "Không thuộc giáo trình" / Unassigned group. */
  book: StudyBook | null;
  lessons: Lesson[];
}

/**
 * Groups lessons by parent Study Book in library order, with the Unassigned group last.
 * Empty groups are omitted.
 */
export function groupLessonsByBook(
  lessons: Record<string, Lesson>,
  books: Record<string, StudyBook>,
  category?: StudyCategory
): LessonGroup[] {
  const groups: LessonGroup[] = Object.values(books)
    .map((book) => ({ book, lessons: getBookLessons(lessons, book.id, category) }))
    .filter((group) => group.lessons.length > 0);
  const unassigned = getUnassignedLessons(lessons, books, category);
  if (unassigned.length > 0) groups.push({ book: null, lessons: unassigned });
  return groups;
}

export function countItems(lessons: Lesson[]): number {
  return lessons.reduce((sum, lesson) => sum + lesson.items.length, 0);
}

/** Real StudyItem IDs currently marked weak inside the given lessons, in lesson/item order. */
export function getWeakItemIds(lessons: Lesson[], progressByItem: Record<string, ItemProgress>): string[] {
  const ids: string[] = [];
  for (const lesson of lessons) {
    for (const item of lesson.items) {
      if (progressByItem[item.id]?.isMarkedWeak === true && !ids.includes(item.id)) ids.push(item.id);
    }
  }
  return ids;
}

/** IDs of the lessons that contain any of the given items (review distractor pool). */
export function getLessonIdsContainingItems(
  lessons: Record<string, Lesson>,
  itemIds: string[]
): string[] {
  const wanted = new Set(itemIds);
  return Object.values(lessons)
    .filter((lesson) => lesson.items.some((item) => wanted.has(item.id)))
    .map((lesson) => lesson.id);
}
