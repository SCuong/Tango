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
 * easter-egg theme revealed from the Settings theme carousel.
 */
export type AppTheme = 'light' | 'dark' | 'sakura' | 'meo';

/** Every accepted theme identifier, in theme-picker order. */
export const APP_THEMES: readonly AppTheme[] = ['light', 'dark', 'sakura', 'meo'];

/** True for a supported theme identifier (unknown stored values fall back to the default). */
export function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === 'string' && (APP_THEMES as readonly string[]).includes(value);
}
export type AppLanguage = 'vi' | 'en';

export interface UserPreferences {
  theme: AppTheme;               // 'light' (default) | 'dark' | 'sakura' | 'meo'
  language: AppLanguage;         // 'vi' (default) | 'en'
  soundEnabled: boolean;         // Default: false (strictly OFF until user enables)
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
