/**
 * Tango — Application Runtime State Bootstrap & Preferences Synchronization Layer
 *
 * Governed by:
 * - docs/ARCHITECTURE.md (§§4, 7)
 * - docs/DATA_MODEL.md (§4)
 * - docs/DESIGN_SYSTEM.md (§§8, 9, 18)
 */

import { Lesson, UserPreferences, UserStudyState, isAnswerLayout, isAppTheme, isIncorrectFeedback } from '../types';
import {
  loadBooks,
  loadLessons,
  loadProgress,
  loadHistory,
  loadPreferences,
} from './storage';
import { initializeLibrary } from '../data';

/**
 * Authoritative schema version of the aggregated runtime UserStudyState.
 */
export const APP_STATE_VERSION = 1;

/**
 * Aggregates all partitioned localStorage stores into the unified runtime UserStudyState.
 * Does not re-initialize seed data; reads directly from canonical stores.
 */
export function loadUserStudyState(): UserStudyState {
  return {
    version: APP_STATE_VERSION,
    preferences: loadPreferences(),
    books: loadBooks(),
    lessons: loadLessons(),
    progressByItem: loadProgress(),
    recentResults: loadHistory(),
  };
}

/**
 * Bootstraps the application runtime state on cold start.
 *
 * Execution order:
 * 1. Invokes seed library initialization (`initializeLibrary()`), which copies bundled
 *    seed lessons into `tango_v1_lessons` if the library has not yet been initialized.
 * 2. Loads and aggregates all partitioned client-side stores via `loadUserStudyState()`.
 *
 * @param seedLessons Optional override for seed lessons (primarily for testing).
 * @returns Complete bootstrapped UserStudyState.
 */
export function bootstrapAppState(seedLessons?: Lesson[]): UserStudyState {
  initializeLibrary(seedLessons);
  return loadUserStudyState();
}

/**
 * Merges a partial UserPreferences update with current preferences,
 * ensuring values conform strictly to allowed theme and language unions.
 */
export function mergePreferences(
  current: UserPreferences,
  patch: Partial<UserPreferences>
): UserPreferences {
  const theme = isAppTheme(patch.theme) ? patch.theme : current.theme;

  const language =
    patch.language === 'en' || patch.language === 'vi'
      ? patch.language
      : current.language;

  const soundEnabled =
    typeof patch.soundEnabled === 'boolean'
      ? patch.soundEnabled
      : current.soundEnabled;

  const answerLayout = isAnswerLayout(patch.answerLayout)
    ? patch.answerLayout
    : current.answerLayout;

  const incorrectFeedback = isIncorrectFeedback(patch.incorrectFeedback)
    ? patch.incorrectFeedback
    : current.incorrectFeedback;

  return {
    theme,
    language,
    soundEnabled,
    answerLayout,
    incorrectFeedback,
  };
}

/**
 * Synchronizes appearance theme and interface language to the document root element:
 * - `document.documentElement.dataset.theme` is set to 'light' | 'dark' | 'sakura' | 'meo'
 * - `document.documentElement.lang` is set to 'vi' | 'en'
 *
 * Safe for execution in non-browser/SSR/Node environments.
 */
export function applyDocumentPreferences(
  preferences: Pick<UserPreferences, 'theme' | 'language'>
): void {
  if (typeof document === 'undefined' || !document.documentElement) {
    return;
  }

  const validTheme = isAppTheme(preferences.theme) ? preferences.theme : 'light';

  if (document.documentElement.dataset) {
    document.documentElement.dataset.theme = validTheme;
  }
  document.documentElement.setAttribute('data-theme', validTheme);

  const validLang = preferences.language === 'en' ? 'en' : 'vi';
  document.documentElement.lang = validLang;
}
