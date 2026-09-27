import { useCallback } from 'react';
import { useI18n } from './useI18n';

/** Localized count labels ("8 bài", "1 item"), shared by detail and management screens. */
export function useCounts() {
  const { t } = useI18n();
  const lessons = useCallback(
    (count: number) =>
      t(count === 1 ? 'metrics.lessonCount.one' : 'metrics.lessonCount.other', { count }),
    [t]
  );
  const items = useCallback(
    (count: number) =>
      t(count === 1 ? 'metrics.itemCount.one' : 'metrics.itemCount.other', { count }),
    [t]
  );
  const accuracy = useCallback(
    (percent: number | null) =>
      percent === null ? t('metrics.accuracyUnknown') : `${percent}%`,
    [t]
  );
  return { lessons, items, accuracy };
}
