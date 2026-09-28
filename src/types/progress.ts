import { StudyBook, Lesson } from './study';
import { QuizSessionResult } from './quiz';

export interface ItemProgress {
  itemId: string;                 // References StudyItem.id
  totalAttempts: number;          // Total times tested
  correctCount: number;           // Times answered correctly
  incorrectCount: number;         // Times answered incorrectly
  lastMistakeAt?: string;         // ISO timestamp of last incorrect response
  lastStudiedAt: string;          // ISO timestamp of last interaction
  isMarkedWeak: boolean;          // Persisted weak/review flag; read selectors consume it as-is
}

/**
 * Light / Dark / Sakura are the standard themes; 'meo' (Mèo mập 😺 / Meo's World) is the special
 * easter-egg theme revealed in the third Settings theme slot.
 */
export type AppTheme = 'light' | 'dark' | 'sakura' | 'meo';

/** Every accepted theme identifier, in theme-picker order. */
export const APP_THEMES: readonly AppTheme[] = ['light', 'dark', 'sakura', 'meo'];

/** True for a supported theme identifier (unknown stored values fall back to the default). */
export function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === 'string' && (APP_THEMES as readonly string[]).includes(value);
}
export type AppLanguage = 'vi' | 'en';

/**
 * How 4-option multiple-choice answers are laid out: a 2×2 grid (default) or stacked 1×4 rows.
 * Grid falls back to stacked per question when an answer is too long or the screen too narrow;
 * that fallback never changes the saved preference.
 */
export type AnswerLayout = 'grid' | 'stacked';

/** Every accepted answer layout, in Settings order. */
export const ANSWER_LAYOUTS: readonly AnswerLayout[] = ['grid', 'stacked'];

/** True for a supported answer layout (missing or unknown stored values fall back to 'grid'). */
export function isAnswerLayout(value: unknown): value is AnswerLayout {
  return typeof value === 'string' && (ANSWER_LAYOUTS as readonly string[]).includes(value);
}

export interface UserPreferences {
  theme: AppTheme;               // 'light' (default) | 'dark' | 'sakura' | 'meo'
  language: AppLanguage;         // 'vi' (default) | 'en'
  soundEnabled: boolean;         // Default: false (strictly OFF until user enables)
  answerLayout: AnswerLayout;    // 'grid' (default) | 'stacked'
}

/**
 * Aggregated runtime client-side state in TypeScript memory.
 * Physical persistence is partitioned across dedicated storage keys.
 */
export interface UserStudyState {
  version: number;                // Schema version for future migrations
  preferences: UserPreferences;
  books: Record<string, StudyBook>; // All textbooks keyed by StudyBook.id
  lessons: Record<string, Lesson>;  // Canonical mutable Lesson store
  progressByItem: Record<string, ItemProgress>;
  recentResults: QuizSessionResult[];
}
