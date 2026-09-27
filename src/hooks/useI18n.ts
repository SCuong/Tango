/**
 * Tango — Localization Hook
 *
 * Governed by:
 * - docs/DESIGN_SYSTEM.md (§7)
 * - docs/ARCHITECTURE.md (§§2, 7)
 */

import { useCallback } from 'react';
import { useAppState } from './useAppState';
import { translate, TranslationKey } from '../lib/i18n';
import { AppLanguage } from '../types';

export interface UseI18nResult {
  language: AppLanguage;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

/**
 * Custom React hook for translating UI strings according to the current user preferences.
 * Derives active language directly from `useAppState().state.preferences.language`
 * with zero redundant local state or secondary persistence.
 */
export function useI18n(): UseI18nResult {
  const { state } = useAppState();
  const language = state.preferences.language;

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      return translate(language, key, params);
    },
    [language]
  );

  return {
    language,
    t,
  };
}
