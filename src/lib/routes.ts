/**
 * Tango — Canonical Route Model & Pure Route Parser
 *
 * Governed by:
 * - docs/SCREEN_SPEC.md (§§1, 2, 4)
 * - docs/ARCHITECTURE.md (§§1, 7)
 */

import { StudyCategory } from '../types';

export interface HomeRoute {
  type: 'home';
}

export interface BookStudyRoute {
  type: 'book_study';
  bookId: string;
}

export interface CategoryInsideBookRoute {
  type: 'category_inside_book';
  bookId: string;
  category: StudyCategory;
}

export interface LearnByTypeRoute {
  type: 'learn_by_type';
  category: StudyCategory;
}

export interface LessonDetailRoute {
  type: 'lesson_detail';
  lessonId: string;
}

export interface LessonItemsRoute {
  type: 'lesson_items';
  lessonId: string;
}

export interface CategoryQuizConfigRoute {
  type: 'category_quiz_config';
  bookId: string;
  category: StudyCategory;
}

export interface BookQuizConfigRoute {
  type: 'book_quiz_config';
  bookId: string;
}

export interface MixedQuizConfigRoute {
  type: 'mixed_quiz_config';
}

export interface QuizSessionRoute {
  type: 'quiz_session';
}

export interface QuizResultsRoute {
  type: 'quiz_results';
}

export interface QuizReviewRoute {
  type: 'quiz_review';
}

export interface SettingsRoute {
  type: 'settings';
}

export interface ContentManagementRoute {
  type: 'content_management';
}

export interface AddBookRoute {
  type: 'add_book';
}

export interface ManageBookRoute {
  type: 'manage_book';
  bookId: string;
}

export interface ManageLessonRoute {
  type: 'manage_lesson';
  lessonId: string;
}

export interface ImportRoute {
  type: 'import';
}

export interface NotFoundRoute {
  type: 'not_found';
  pathname: string;
}

export type AppRoute =
  | HomeRoute
  | BookStudyRoute
  | CategoryInsideBookRoute
  | LearnByTypeRoute
  | LessonDetailRoute
  | LessonItemsRoute
  | CategoryQuizConfigRoute
  | BookQuizConfigRoute
  | MixedQuizConfigRoute
  | QuizSessionRoute
  | QuizResultsRoute
  | QuizReviewRoute
  | SettingsRoute
  | ContentManagementRoute
  | AddBookRoute
  | ManageBookRoute
  | ManageLessonRoute
  | ImportRoute
  | NotFoundRoute;

/**
 * Type guard validating that a string is a valid StudyCategory.
 * Rejects invalid categories instead of coercing them.
 */
export function isStudyCategory(value: unknown): value is StudyCategory {
  return value === 'vocabulary' || value === 'kanji';
}

/**
 * Safely decodes a percent-encoded URI component.
 * Never throws on malformed encoding; returns null instead.
 */
export function safeDecodeURIComponent(encoded: string): string | null {
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

/**
 * Parses a browser pathname string into a strongly-typed AppRoute.
 * Handles harmless trailing slashes, queries, hashes, and malformed encoding safely.
 */
export function parseRoute(pathname: string): AppRoute {
  if (typeof pathname !== 'string') {
    return { type: 'not_found', pathname: '' };
  }

  // Strip query parameters and hash anchors, then trim whitespace
  const rawPath = pathname.split('?')[0].split('#')[0].trim();

  // Normalize harmless trailing slashes: e.g. "/settings/" -> "/settings", while "/" remains "/"
  const cleanPath = rawPath.replace(/\/+$/, '') || '/';

  if (cleanPath === '/' || cleanPath === '') {
    return { type: 'home' };
  }

  // Split into segments (first element is empty string because cleanPath starts with '/')
  const segments = cleanPath.split('/').slice(1);

  // 1. /book/...
  if (segments[0] === 'book') {
    // /book/:bookId
    if (segments.length === 2) {
      const bookId = safeDecodeURIComponent(segments[1]);
      if (!bookId || bookId.trim() === '') {
        return { type: 'not_found', pathname };
      }
      return { type: 'book_study', bookId };
    }

    // /book/:bookId/quiz-config
    if (segments.length === 3 && segments[2] === 'quiz-config') {
      const bookId = safeDecodeURIComponent(segments[1]);
      if (!bookId || bookId.trim() === '') {
        return { type: 'not_found', pathname };
      }
      return { type: 'book_quiz_config', bookId };
    }

    // /book/:bookId/category/:category
    if (segments.length === 4 && segments[2] === 'category') {
      const bookId = safeDecodeURIComponent(segments[1]);
      const category = segments[3];
      if (!bookId || bookId.trim() === '' || !isStudyCategory(category)) {
        return { type: 'not_found', pathname };
      }
      return { type: 'category_inside_book', bookId, category };
    }

    // /book/:bookId/category/:category/quiz-config
    if (
      segments.length === 5 &&
      segments[2] === 'category' &&
      segments[4] === 'quiz-config'
    ) {
      const bookId = safeDecodeURIComponent(segments[1]);
      const category = segments[3];
      if (!bookId || bookId.trim() === '' || !isStudyCategory(category)) {
        return { type: 'not_found', pathname };
      }
      return { type: 'category_quiz_config', bookId, category };
    }

    return { type: 'not_found', pathname };
  }

  // 2. /learn/:category
  if (segments[0] === 'learn') {
    if (segments.length === 2) {
      const category = segments[1];
      if (isStudyCategory(category)) {
        return { type: 'learn_by_type', category };
      }
    }
    return { type: 'not_found', pathname };
  }

  // 3. /lesson/...
  if (segments[0] === 'lesson') {
    // /lesson/:lessonId
    if (segments.length === 2) {
      const lessonId = safeDecodeURIComponent(segments[1]);
      if (!lessonId || lessonId.trim() === '') {
        return { type: 'not_found', pathname };
      }
      return { type: 'lesson_detail', lessonId };
    }

    // /lesson/:lessonId/items
    if (segments.length === 3 && segments[2] === 'items') {
      const lessonId = safeDecodeURIComponent(segments[1]);
      if (!lessonId || lessonId.trim() === '') {
        return { type: 'not_found', pathname };
      }
      return { type: 'lesson_items', lessonId };
    }

    return { type: 'not_found', pathname };
  }

  // 4. /quiz/...
  if (segments[0] === 'quiz') {
    if (segments.length === 2) {
      switch (segments[1]) {
        case 'mixed-config':
          return { type: 'mixed_quiz_config' };
        case 'session':
          return { type: 'quiz_session' };
        case 'results':
          return { type: 'quiz_results' };
        case 'review':
          return { type: 'quiz_review' };
      }
    }
    return { type: 'not_found', pathname };
  }

  // 5. /settings/...
  if (segments[0] === 'settings') {
    if (segments.length === 1) {
      return { type: 'settings' };
    }

    if (segments.length === 2 && segments[1] === 'content-management') {
      return { type: 'content_management' };
    }

    if (segments.length === 3 && segments[1] === 'content-management') {
      if (segments[2] === 'add-book') {
        return { type: 'add_book' };
      }
      if (segments[2] === 'import') {
        return { type: 'import' };
      }
    }

    if (segments.length === 4 && segments[1] === 'content-management') {
      if (segments[2] === 'book') {
        const bookId = safeDecodeURIComponent(segments[3]);
        if (!bookId || bookId.trim() === '') {
          return { type: 'not_found', pathname };
        }
        return { type: 'manage_book', bookId };
      }
      if (segments[2] === 'lesson') {
        const lessonId = safeDecodeURIComponent(segments[3]);
        if (!lessonId || lessonId.trim() === '') {
          return { type: 'not_found', pathname };
        }
        return { type: 'manage_lesson', lessonId };
      }
    }

    return { type: 'not_found', pathname };
  }

  return { type: 'not_found', pathname };
}

/**
 * Builds a canonical pathname from an AppRoute, encoding dynamic parameters.
 */
export function buildPath(route: AppRoute): string {
  switch (route.type) {
    case 'home':
      return '/';
    case 'book_study':
      return `/book/${encodeURIComponent(route.bookId)}`;
    case 'category_inside_book':
      return `/book/${encodeURIComponent(route.bookId)}/category/${route.category}`;
    case 'learn_by_type':
      return `/learn/${route.category}`;
    case 'lesson_detail':
      return `/lesson/${encodeURIComponent(route.lessonId)}`;
    case 'lesson_items':
      return `/lesson/${encodeURIComponent(route.lessonId)}/items`;
    case 'category_quiz_config':
      return `/book/${encodeURIComponent(route.bookId)}/category/${route.category}/quiz-config`;
    case 'book_quiz_config':
      return `/book/${encodeURIComponent(route.bookId)}/quiz-config`;
    case 'mixed_quiz_config':
      return '/quiz/mixed-config';
    case 'quiz_session':
      return '/quiz/session';
    case 'quiz_results':
      return '/quiz/results';
    case 'quiz_review':
      return '/quiz/review';
    case 'settings':
      return '/settings';
    case 'content_management':
      return '/settings/content-management';
    case 'add_book':
      return '/settings/content-management/add-book';
    case 'manage_book':
      return `/settings/content-management/book/${encodeURIComponent(route.bookId)}`;
    case 'manage_lesson':
      return `/settings/content-management/lesson/${encodeURIComponent(route.lessonId)}`;
    case 'import':
      return '/settings/content-management/import';
    case 'not_found':
      return route.pathname.startsWith('/') ? route.pathname : `/${route.pathname}`;
  }
}

/**
 * Alias for parseRoute.
 */
export const parsePath = parseRoute;
