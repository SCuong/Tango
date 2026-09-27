/**
 * Tango — Pure Study Metrics & Browsing Progress Selectors
 *
 * Governed by:
 * - docs/DATA_MODEL.md (§4)
 * - docs/SCREEN_SPEC.md (§§1, 6)
 * - docs/screens/STUDY_SCREENS.md (SCREEN 01–06)
 */

import { StudyItem, Lesson, StudyCategory, ItemProgress } from '../types';

/**
 * Core metrics calculated over a scope of StudyItems.
 */
export interface StudyMetrics {
  itemCount: number;
  studiedItemCount: number;

  totalAttempts: number;
  correctCount: number;
  incorrectCount: number;

  weakItemCount: number;

  coveragePercent: number;
  accuracyPercent: number | null;
}

/**
 * Aggregated metrics including lesson counts for collections (books and categories).
 */
export interface StudyCollectionMetrics extends StudyMetrics {
  lessonCount: number;
}

/**
 * Internal helper to convert a Lesson array or Lesson dictionary into a flat Lesson array.
 */
function toLessonArray(lessons: Lesson[] | Record<string, Lesson>): Lesson[] {
  return Array.isArray(lessons) ? lessons : Object.values(lessons);
}

/**
 * Calculates canonical study browsing metrics for a given array of StudyItems.
 *
 * Rules:
 * - Study Coverage = (studiedItemCount / itemCount) * 100, rounded with Math.round.
 *   An item is studied iff progressByItem[item.id]?.totalAttempts > 0.
 *   If itemCount === 0, coveragePercent is 0.
 * - Answer Accuracy = (correctCount / totalAttempts) * 100, rounded with Math.round.
 *   If aggregate totalAttempts === 0, accuracyPercent is null.
 * - Weak Item Count = count of scoped items with ItemProgress.isMarkedWeak === true.
 * - Missing progress records contribute 0 attempts and are not weak.
 * - Orphaned progress records outside the provided items array are ignored.
 */
export function calculateStudyMetrics(
  items: StudyItem[],
  progressByItem: Record<string, ItemProgress> = {}
): StudyMetrics {
  const itemCount = items.length;

  if (itemCount === 0) {
    return {
      itemCount: 0,
      studiedItemCount: 0,
      totalAttempts: 0,
      correctCount: 0,
      incorrectCount: 0,
      weakItemCount: 0,
      coveragePercent: 0,
      accuracyPercent: null,
    };
  }

  let studiedItemCount = 0;
  let totalAttempts = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let weakItemCount = 0;

  for (const item of items) {
    const progress = progressByItem[item.id];
    if (progress) {
      if (progress.totalAttempts > 0) {
        studiedItemCount += 1;
        totalAttempts += progress.totalAttempts;
        correctCount += progress.correctCount;
        incorrectCount += progress.incorrectCount;
      }
      if (progress.isMarkedWeak === true) {
        weakItemCount += 1;
      }
    }
  }

  const coveragePercent = Math.round((studiedItemCount / itemCount) * 100);
  const accuracyPercent =
    totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : null;

  return {
    itemCount,
    studiedItemCount,
    totalAttempts,
    correctCount,
    incorrectCount,
    weakItemCount,
    coveragePercent,
    accuracyPercent,
  };
}

/**
 * Calculates study metrics for a single Lesson.
 * Evaluates exactly lesson.items.
 */
export function getLessonStudyMetrics(
  lesson: Lesson,
  progressByItem: Record<string, ItemProgress> = {}
): StudyMetrics {
  return calculateStudyMetrics(lesson.items, progressByItem);
}

/**
 * Calculates study metrics across all lessons belonging to a specific Study Book.
 *
 * Rules:
 * - Scoped strictly to lessons where `lesson.bookId === bookId`.
 * - Includes both vocabulary and kanji lessons for the book.
 * - Unassigned lessons (bookId undefined) are never included.
 * - Items are not quiz-deduplicated; every curriculum StudyItem record is counted.
 */
export function getBookStudyMetrics(
  bookId: string,
  lessons: Lesson[] | Record<string, Lesson>,
  progressByItem: Record<string, ItemProgress> = {}
): StudyCollectionMetrics {
  const lessonList = toLessonArray(lessons);
  const matchingLessons = lessonList.filter(
    (lesson) => lesson.bookId !== undefined && lesson.bookId === bookId
  );

  const allItems: StudyItem[] = [];
  for (const lesson of matchingLessons) {
    allItems.push(...lesson.items);
  }

  const baseMetrics = calculateStudyMetrics(allItems, progressByItem);

  return {
    ...baseMetrics,
    lessonCount: matchingLessons.length,
  };
}

/**
 * Calculates study metrics for a category, optionally scoped to a specific Study Book.
 *
 * Rules:
 * - When `optionalBookId` is provided: includes only lessons where
 *   `lesson.category === category && lesson.bookId === optionalBookId`.
 * - When `optionalBookId` is omitted (Global Learn by Type): includes all lessons where
 *   `lesson.category === category`, including unassigned lessons.
 * - Items are not quiz-deduplicated; every curriculum StudyItem record is counted.
 */
export function getCategoryStudyMetrics(
  category: StudyCategory,
  lessons: Lesson[] | Record<string, Lesson>,
  progressByItem: Record<string, ItemProgress> = {},
  optionalBookId?: string
): StudyCollectionMetrics {
  const lessonList = toLessonArray(lessons);
  const matchingLessons = lessonList.filter((lesson) => {
    if (lesson.category !== category) {
      return false;
    }
    if (optionalBookId !== undefined) {
      return lesson.bookId === optionalBookId;
    }
    return true;
  });

  const allItems: StudyItem[] = [];
  for (const lesson of matchingLessons) {
    allItems.push(...lesson.items);
  }

  const baseMetrics = calculateStudyMetrics(allItems, progressByItem);

  return {
    ...baseMetrics,
    lessonCount: matchingLessons.length,
  };
}
