/**
 * Tango — Content Management Mutations & Hard-Delete Cascades
 *
 * Governed by:
 * - docs/CONTENT_LIBRARY_SPEC.md (§§2, 14, 16 – 20)
 * - docs/ARCHITECTURE.md (§4.3 Ordered, Idempotent Hard-Delete Cascade)
 * - docs/DATA_MODEL.md (§§2, 4.2)
 *
 * Pure helpers build new records; the cascade functions read fresh data from storage and
 * write each partition in the documented order so an interrupted delete can simply be retried.
 */

import { Lesson, StudyBook, StudyCategory, StudyItem, QuizSessionResult } from '../types';
import {
  deleteCoverBlob,
  loadBooks,
  loadHistory,
  loadLessons,
  loadProgress,
  saveBooks,
  saveHistory,
  saveLessons,
  saveProgress,
} from './storage';
import { createId } from './ids';

/** Trimmed title; empty or whitespace-only titles are invalid (duplicates allowed). */
export function normalizeTitle(title: string): string {
  return title.replace(/\s+/g, ' ').trim().normalize('NFC');
}

export function isValidTitle(title: string): boolean {
  return normalizeTitle(title) !== '';
}

export function createStudyBook(
  title: string,
  coverImageId: string | undefined,
  now: Date
): StudyBook {
  const iso = now.toISOString();
  const book: StudyBook = {
    id: createId('book'),
    title: normalizeTitle(title),
    createdAt: iso,
    updatedAt: iso,
  };
  if (coverImageId) book.coverImageId = coverImageId;
  return book;
}

/** Returns a copy of the book with the given changes; `coverImageId: undefined` removes it. */
export function updateStudyBook(
  book: StudyBook,
  patch: { title?: string; coverImageId?: string | undefined },
  now: Date
): StudyBook {
  const next: StudyBook = { ...book, updatedAt: now.toISOString() };
  if (patch.title !== undefined) next.title = normalizeTitle(patch.title);
  if ('coverImageId' in patch) {
    if (patch.coverImageId) next.coverImageId = patch.coverImageId;
    else delete next.coverImageId;
  }
  return next;
}

export interface LessonMetadataPatch {
  title: string;
  subtitle?: string;
  category: StudyCategory;
  bookId?: string;
}

/**
 * Organizational metadata only: never changes `Lesson.id` or item IDs, so progress and
 * history stay attached (CONTENT_LIBRARY_SPEC §20).
 */
export function updateLessonMetadata(lesson: Lesson, patch: LessonMetadataPatch): Lesson {
  const next: Lesson = {
    ...lesson,
    title: normalizeTitle(patch.title),
    category: patch.category,
  };
  const subtitle = patch.subtitle !== undefined ? normalizeTitle(patch.subtitle) : '';
  if (subtitle) next.subtitle = subtitle;
  else delete next.subtitle;
  if (patch.bookId) next.bookId = patch.bookId;
  else delete next.bookId;
  return next;
}

export function createLesson(
  meta: { title: string; category: StudyCategory; bookId?: string },
  items: Omit<StudyItem, 'id'>[]
): Lesson {
  const lesson: Lesson = {
    id: createId('lesson'),
    category: meta.category,
    title: normalizeTitle(meta.title),
    items: items.map((item) => ({ ...item, id: createId('item') })),
  };
  if (meta.bookId) lesson.bookId = meta.bookId;
  return lesson;
}

/** Lessons in library order, optionally filtered. */
export function listLessons(
  lessons: Record<string, Lesson>,
  filter: (lesson: Lesson) => boolean = () => true
): Lesson[] {
  return Object.values(lessons).filter(filter);
}

/* ==========================================================================
   Deletion scope resolution (pure)
   ========================================================================== */

export interface BookDeletionScope {
  deletedBookId: string;
  coverImageId?: string;
  affectedLessonIds: string[];
  affectedStudyItemIds: string[];
  affectedHistoryIds: string[];
}

export interface LessonDeletionScope {
  targetLessonId: string;
  affectedStudyItemIds: string[];
  affectedHistoryIds: string[];
}

function resolveHistoryIds(
  history: QuizSessionResult[],
  lessonIds: ReadonlySet<string>,
  itemIds: ReadonlySet<string>
): string[] {
  return history
    .filter(
      (session) =>
        (session.lessonIds ?? []).some((id) => lessonIds.has(id)) ||
        (session.missedItemIds ?? []).some((id) => itemIds.has(id))
    )
    .map((session) => session.sessionId);
}

export function resolveBookDeletionScope(
  bookId: string,
  books: Record<string, StudyBook>,
  lessons: Record<string, Lesson>,
  history: QuizSessionResult[]
): BookDeletionScope {
  const affectedLessons = Object.values(lessons).filter((lesson) => lesson.bookId === bookId);
  const affectedLessonIds = affectedLessons.map((lesson) => lesson.id);
  const affectedStudyItemIds = affectedLessons.flatMap((lesson) => lesson.items.map((i) => i.id));
  return {
    deletedBookId: bookId,
    coverImageId: books[bookId]?.coverImageId,
    affectedLessonIds,
    affectedStudyItemIds,
    affectedHistoryIds: resolveHistoryIds(
      history,
      new Set(affectedLessonIds),
      new Set(affectedStudyItemIds)
    ),
  };
}

export function resolveLessonDeletionScope(
  lessonId: string,
  lessons: Record<string, Lesson>,
  history: QuizSessionResult[]
): LessonDeletionScope {
  const affectedStudyItemIds = (lessons[lessonId]?.items ?? []).map((item) => item.id);
  return {
    targetLessonId: lessonId,
    affectedStudyItemIds,
    affectedHistoryIds: resolveHistoryIds(
      history,
      new Set([lessonId]),
      new Set(affectedStudyItemIds)
    ),
  };
}

/* ==========================================================================
   Ordered, idempotent hard-delete cascades (storage-backed)
   ========================================================================== */

function purgeProgress(itemIds: string[]): void {
  if (itemIds.length === 0) return;
  const progress = loadProgress();
  let changed = false;
  for (const id of itemIds) {
    if (id in progress) {
      delete progress[id];
      changed = true;
    }
  }
  if (changed) saveProgress(progress);
}

function purgeHistory(sessionIds: string[]): void {
  if (sessionIds.length === 0) return;
  const remove = new Set(sessionIds);
  const history = loadHistory();
  const kept = history.filter((session) => !remove.has(session.sessionId));
  if (kept.length !== history.length) saveHistory(kept);
}

/**
 * Deletes a Study Book, all of its lessons, their items' progress, affected history records,
 * and its cover Blob. The book metadata is removed LAST because it holds the cover reference
 * needed to retry an interrupted delete (ARCHITECTURE §4.3).
 *
 * `clearActiveReferences` receives the resolved scope before any storage mutation (step 2).
 */
export async function deleteBookCascade(
  bookId: string,
  clearActiveReferences: (scope: BookDeletionScope) => void = () => {}
): Promise<BookDeletionScope> {
  // 1. Resolve the full scope in memory before mutating anything
  const scope = resolveBookDeletionScope(bookId, loadBooks(), loadLessons(), loadHistory());
  // 2. Clear in-memory references (quiz selections, review filters)
  clearActiveReferences(scope);
  // 3. Purge ItemProgress
  purgeProgress(scope.affectedStudyItemIds);
  // 4. Delete whole affected history records
  purgeHistory(scope.affectedHistoryIds);
  // 5. Delete the cover Blob while book metadata still references it
  if (scope.coverImageId) {
    await deleteCoverBlob(scope.coverImageId);
  }
  // 6. Delete affected lessons
  if (scope.affectedLessonIds.length > 0) {
    const lessons = loadLessons();
    for (const id of scope.affectedLessonIds) delete lessons[id];
    saveLessons(lessons);
  }
  // 7. Delete the StudyBook metadata last
  const books = loadBooks();
  if (bookId in books) {
    delete books[bookId];
    saveBooks(books);
  }
  return scope;
}

/**
 * Deletes one lesson with its items' progress and affected history records. The lesson record
 * itself is removed LAST; the parent book stays intact (CONTENT_LIBRARY_SPEC §18.1).
 */
export function deleteLessonCascade(
  lessonId: string,
  clearActiveReferences: (scope: LessonDeletionScope) => void = () => {}
): LessonDeletionScope {
  const scope = resolveLessonDeletionScope(lessonId, loadLessons(), loadHistory());
  clearActiveReferences(scope);
  purgeProgress(scope.affectedStudyItemIds);
  purgeHistory(scope.affectedHistoryIds);
  const lessons = loadLessons();
  if (lessonId in lessons) {
    delete lessons[lessonId];
    saveLessons(lessons);
  }
  return scope;
}

/**
 * Removes a book cover: deletes the Blob, then clears `coverImageId`. Lessons, items,
 * progress, and history are untouched (CONTENT_LIBRARY_SPEC §19).
 */
export async function removeBookCover(bookId: string, now: Date): Promise<void> {
  const book = loadBooks()[bookId];
  if (!book) return;
  if (book.coverImageId) {
    await deleteCoverBlob(book.coverImageId);
  }
  const books = loadBooks();
  if (books[bookId]) {
    books[bookId] = updateStudyBook(books[bookId], { coverImageId: undefined }, now);
    saveBooks(books);
  }
}
