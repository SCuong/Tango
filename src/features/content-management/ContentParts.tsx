import React from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Lesson } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useCounts } from '../../hooks/useCounts';
import { Button } from '../../components/Button';
import { CATEGORY_GLYPHS, CATEGORY_LABEL_KEYS, CATEGORY_SURFACE_CLASSES, LessonTitle } from '../study/StudyParts';

/** Small category tag: Japanese glyph + localized name on the category identity surface. */
export const CategoryTag: React.FC<{ category: Lesson['category'] }> = ({ category }) => {
  const { t } = useI18n();
  const tone = CATEGORY_SURFACE_CLASSES[category];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs font-semibold leading-snug whitespace-nowrap ${tone.surface} ${tone.text}`}
    >
      <span lang="ja" aria-hidden="true" className={`font-japanese ${tone.glyph}`}>
        {CATEGORY_GLYPHS[category][0]}
      </span>
      {t(CATEGORY_LABEL_KEYS[category])}
    </span>
  );
};

/**
 * Management lesson row: title, category, item count, and only a `[ Quản lý ]` action
 * (never an inline delete; CONTENT_LIBRARY_SPEC §14.2).
 */
export const ManagedLessonRow: React.FC<{ lesson: Lesson; onManage: () => void }> = ({ lesson, onManage }) => {
  const { t } = useI18n();
  const counts = useCounts();
  return (
    <li className="px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <LessonTitle lesson={lesson} className="block" />
        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <CategoryTag category={lesson.category} />
          <span>{counts.items(lesson.items.length)}</span>
        </span>
      </div>
      <Button onClick={onManage} aria-label={t('content.manageAria', { title: lesson.title })} className="shrink-0">
        {t('content.manage')}
      </Button>
    </li>
  );
};

/** Danger Zone: separated, bordered with a muted error line, one explicit destructive action. */
export const DangerZone: React.FC<{
  description: string;
  actionLabel: string;
  onAction: () => void;
  headingId: string;
}> = ({ description, actionLabel, onAction, headingId }) => {
  const { t } = useI18n();
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-error-border bg-surface p-4 sm:p-5"
    >
      <h2 id={headingId} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-error-text">
        <IconAlertTriangle size={16} stroke={2} aria-hidden="true" />
        {t('danger.title')}
      </h2>
      <p className="mt-2 text-sm text-text-secondary leading-relaxed">{description}</p>
      <Button variant="danger" className="mt-3" onClick={onAction}>
        {actionLabel}
      </Button>
    </section>
  );
};
