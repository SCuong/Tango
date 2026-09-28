/**
 * Tango — Quiz return context (QUIZ_SESSION_SCREENS SCREEN 14).
 *
 * Quiz Results returns to the study context the quiz started from, not always Home. The origin is
 * explicit runtime metadata set by each quiz entry point (`QuizSessionConfig.returnTarget`), carried
 * unchanged through Retry and Review Missed, and never written to history. Missing metadata (an old
 * or test-created session) falls back to Home. The quiz engine never sees it.
 */
import {
  BookStudyRoute,
  CategoryInsideBookRoute,
  HomeRoute,
  LessonDetailRoute,
  MixedQuizConfigRoute,
  isStudyCategory,
} from './routes';
import { TranslationKey } from './i18n';

/** The study contexts a quiz can return to: a restricted subset of the app routes. */
export type QuizReturnTarget =
  | LessonDetailRoute
  | CategoryInsideBookRoute
  | BookStudyRoute
  | MixedQuizConfigRoute
  | HomeRoute;

export const HOME_RETURN_TARGET: HomeRoute = { type: 'home' };

/** Icon of the return action: a back arrow for study contexts, the Test icon, or Home. */
export type QuizReturnIcon = 'back' | 'test' | 'home';

export interface QuizReturnAction {
  route: QuizReturnTarget;
  /** Localized label: `labelKey`, with `{place}` filled from `placeKey` when present. */
  labelKey: TranslationKey;
  placeKey?: TranslationKey;
  icon: QuizReturnIcon;
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** True for a well-formed return target (anything else falls back to Home). */
export function isQuizReturnTarget(value: unknown): value is QuizReturnTarget {
  if (!value || typeof value !== 'object') return false;
  const target = value as Record<string, unknown>;
  switch (target.type) {
    case 'lesson_detail':
      return isId(target.lessonId);
    case 'category_inside_book':
      return isId(target.bookId) && isStudyCategory(target.category);
    case 'book_study':
      return isId(target.bookId);
    case 'mixed_quiz_config':
    case 'home':
      return true;
    default:
      return false;
  }
}

/** The Results return action for a session's return target; missing or invalid means Home. */
export function getQuizReturnAction(target: unknown): QuizReturnAction {
  if (!isQuizReturnTarget(target)) {
    return { route: HOME_RETURN_TARGET, labelKey: 'results.home', icon: 'home' };
  }
  switch (target.type) {
    case 'category_inside_book':
      return { route: target, labelKey: 'results.returnTo', placeKey: `category.${target.category}`, icon: 'back' };
    case 'book_study':
      return { route: target, labelKey: 'results.returnBook', icon: 'back' };
    case 'lesson_detail':
      return { route: target, labelKey: 'results.returnLesson', icon: 'back' };
    case 'mixed_quiz_config':
      return { route: target, labelKey: 'results.returnTo', placeKey: 'nav.test', icon: 'test' };
    case 'home':
      return { route: target, labelKey: 'results.home', icon: 'home' };
  }
}

/** Localized label of a return action. */
export function formatQuizReturnLabel(
  action: QuizReturnAction,
  t: (key: TranslationKey, params?: Record<string, string>) => string
): string {
  return action.placeKey ? t(action.labelKey, { place: t(action.placeKey) }) : t(action.labelKey);
}

/** Return target for a quiz started from a lesson (Practice, Quick Test, lesson Review). */
export function lessonReturnTarget(lessonId: string): LessonDetailRoute {
  return { type: 'lesson_detail', lessonId };
}

