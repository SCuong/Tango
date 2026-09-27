/**
 * Tango — Localization Foundation & Translation Dictionaries
 *
 * Governed by:
 * - docs/DESIGN_SYSTEM.md (§7)
 * - docs/ARCHITECTURE.md (§§1, 7)
 * - docs/DATA_MODEL.md (§4)
 */

import { AppLanguage } from '../types';

/**
 * Authoritative Vietnamese dictionary (default conceptual source language).
 * Defines the canonical set of translation keys for the application.
 */
export const VI_DICTIONARY = {
  // Common / Brand
  'app.name': 'Tango',
  'app.tagline': 'Học từ vựng và chữ Hán tiếng Nhật cho người Việt',

  // Navigation
  'nav.home': 'Trang chủ',
  'nav.back': 'Quay lại',
  'nav.settings': 'Cài đặt',
  'nav.contentManagement': 'Quản lý nội dung',

  // Actions
  'action.continue': 'Tiếp tục',
  'action.cancel': 'Hủy',
  'action.save': 'Lưu',
  'action.delete': 'Xóa',
  'action.close': 'Đóng',
  'action.start': 'Bắt đầu',
  'action.retry': 'Thử lại',

  // Categories
  'category.vocabulary': 'Từ vựng',
  'category.kanji': 'Hán tự',

  // Appearance & Preferences
  'preferences.theme': 'Giao diện',
  'preferences.theme.light': 'Sáng',
  'preferences.theme.dark': 'Tối',
  'preferences.theme.sakura': 'Sakura',
  'preferences.language': 'Ngôn ngữ',
  'preferences.language.vi': 'Tiếng Việt',
  'preferences.language.en': 'English',
  'preferences.sound': 'Âm thanh hiệu ứng',
  'preferences.sound.on': 'Bật',
  'preferences.sound.off': 'Tắt',

  // Global / Generic States
  'state.loading': 'Đang tải...',
  'state.empty': 'Không có dữ liệu',
  'state.notFound': 'Không tìm thấy trang',
  'state.notImplemented': 'Tính năng đang được phát triển',

  // Home Screen (SCREEN 01)
  'home.studyBooks': 'Giáo trình',
  'home.learnByType': 'Học theo loại',
  'home.mixedTest': 'Kiểm tra tổng hợp',
  'home.emptyBooks.title': 'Chưa có giáo trình nào.',
  'home.emptyBooks.description': 'Bạn có thể thêm giáo trình trong: Cài đặt → Quản lý nội dung.',

  // Metrics & Counters
  'metrics.lessonCount.one': '{count} bài',
  'metrics.lessonCount.other': '{count} bài',
  'metrics.itemCount.one': '{count} mục',
  'metrics.itemCount.other': '{count} mục',
  'metrics.coverage': '{percent}%',

  // Accessibility / ARIA
  'aria.openBook': 'Mở giáo trình {title}',
  'aria.bookCover': 'Bìa giáo trình {title}',
  'aria.learnCategory': 'Học theo loại: {category}',
  'aria.progressCoverage': 'Độ bao phủ: {percent}%',
} as const;

/**
 * Strongly typed translation key representing every available translation string.
 */
export type TranslationKey = keyof typeof VI_DICTIONARY;

/**
 * English dictionary.
 * The `Record<TranslationKey, string>` type enforces compile-time symmetry:
 * any missing or extra key in the English dictionary produces a TypeScript compilation error.
 */
export const EN_DICTIONARY: Record<TranslationKey, string> = {
  // Common / Brand
  'app.name': 'Tango',
  'app.tagline': 'Japanese vocabulary and Kanji learning for Vietnamese learners',

  // Navigation
  'nav.home': 'Home',
  'nav.back': 'Back',
  'nav.settings': 'Settings',
  'nav.contentManagement': 'Content Management',

  // Actions
  'action.continue': 'Continue',
  'action.cancel': 'Cancel',
  'action.save': 'Save',
  'action.delete': 'Delete',
  'action.close': 'Close',
  'action.start': 'Start',
  'action.retry': 'Retry',

  // Categories
  'category.vocabulary': 'Vocabulary',
  'category.kanji': 'Kanji',

  // Appearance & Preferences
  'preferences.theme': 'Theme',
  'preferences.theme.light': 'Light',
  'preferences.theme.dark': 'Dark',
  'preferences.theme.sakura': 'Sakura',
  'preferences.language': 'Language',
  'preferences.language.vi': 'Tiếng Việt',
  'preferences.language.en': 'English',
  'preferences.sound': 'Sound Effects',
  'preferences.sound.on': 'On',
  'preferences.sound.off': 'Off',

  // Global / Generic States
  'state.loading': 'Loading...',
  'state.empty': 'No data available',
  'state.notFound': 'Page not found',
  'state.notImplemented': 'Feature in development',

  // Home Screen (SCREEN 01)
  'home.studyBooks': 'Study Books',
  'home.learnByType': 'Learn by Type',
  'home.mixedTest': 'Mixed Test',
  'home.emptyBooks.title': 'No study books yet.',
  'home.emptyBooks.description': 'You can add study books from: Settings → Content Management.',

  // Metrics & Counters
  'metrics.lessonCount.one': '{count} lesson',
  'metrics.lessonCount.other': '{count} lessons',
  'metrics.itemCount.one': '{count} item',
  'metrics.itemCount.other': '{count} items',
  'metrics.coverage': '{percent}%',

  // Accessibility / ARIA
  'aria.openBook': 'Open study book: {title}',
  'aria.bookCover': 'Book cover: {title}',
  'aria.learnCategory': 'Learn by type: {category}',
  'aria.progressCoverage': 'Study coverage: {percent}%',
};

/**
 * Master dictionary map keyed strictly by AppLanguage ('vi' | 'en').
 */
export const DICTIONARIES: Record<AppLanguage, Record<TranslationKey, string>> = {
  vi: VI_DICTIONARY,
  en: EN_DICTIONARY,
};

/**
 * Pure translation function.
 * Looks up the translation key for the specified language, falling back to
 * Vietnamese if missing, and optionally interpolating {key} or {{key}} parameters.
 */
export function translate(
  language: AppLanguage,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const dict = DICTIONARIES[language] ?? DICTIONARIES.vi;
  const template = dict[key] ?? VI_DICTIONARY[key] ?? key;

  if (!params) {
    return template;
  }

  let result = template;
  for (const [paramKey, paramValue] of Object.entries(params)) {
    const val = String(paramValue);
    result = result
      .replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), val)
      .replace(new RegExp(`\\{${paramKey}\\}`, 'g'), val);
  }

  return result;
}

/**
 * Pure shorthand alias for `translate`.
 */
export const t = translate;
