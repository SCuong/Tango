import React from 'react';
import { IconChevronRight } from '@tabler/icons-react';
import { ItemProgress, Lesson, StudyBook, StudyCategory } from '../../types';
import { getLessonStudyMetrics } from '../../lib/studyMetrics';
import { useCounts } from '../../hooks/useCounts';
import { useI18n } from '../../hooks/useI18n';
import { usePressFeedback } from '../../hooks/usePressFeedback';
import { FOCUS_RING } from '../../components/Button';
import { BookCover } from '../books/BookCover';
import { TranslationKey } from '../../lib/i18n';

/** Japanese category names used as identity glyphs (study content, not UI locale). */
export const CATEGORY_GLYPHS: Record<StudyCategory, string> = {
  vocabulary: '語彙',
  kanji: '漢字',
};

export const CATEGORY_LABEL_KEYS: Record<StudyCategory, TranslationKey> = {
  vocabulary: 'category.vocabulary',
  kanji: 'category.kanji',
};

/** Static class strings per category so Tailwind picks them up. */
export const CATEGORY_SURFACE_CLASSES: Record<StudyCategory, { surface: string; glyph: string; text: string }> = {
  vocabulary: {
    surface: 'bg-category-vocabulary-surface border-category-vocabulary-border',
    glyph: 'text-category-vocabulary-icon',
    text: 'text-category-vocabulary-text',
  },
  kanji: {
    surface: 'bg-category-kanji-surface border-category-kanji-border',
    glyph: 'text-category-kanji-icon',
    text: 'text-category-kanji-text',
  },
};

/** Small 3:4 cover thumbnail (real cover or theme-aware placeholder). */
export const BookThumb: React.FC<{ book: StudyBook; className?: string }> = ({ book, className = 'w-9' }) => (
  <div
    className={`${className} aspect-[3/4] rounded-md overflow-hidden shrink-0 border border-border-subtle`}
  >
    <BookCover coverImageId={book.coverImageId} title={book.title} />
  </div>
);

/** Primary line + optional subtitle for a lesson. */
export const LessonTitle: React.FC<{ lesson: Lesson; className?: string }> = ({ lesson, className = '' }) => (
  <span className={`min-w-0 ${className}`}>
    <span className="block font-study-title font-semibold text-text-primary text-[15px] sm:text-base leading-snug break-words">
      {lesson.title}
    </span>
    {lesson.subtitle && (
      <span className="block font-study-title text-sm text-text-secondary leading-snug break-words mt-0.5">
        {lesson.subtitle}
      </span>
    )}
  </span>
);

export interface LessonRowProps {
  lesson: Lesson;
  progressByItem: Record<string, ItemProgress>;
  onOpen: () => void;
}

/**
 * Flat lesson row (dense list level of the clay hierarchy): title, subtitle, item count,
 * and Answer Accuracy (`--` when unattempted). Minimum 56px touch target.
 */
export const LessonRow: React.FC<LessonRowProps> = ({ lesson, progressByItem, onOpen }) => {
  const counts = useCounts();
  const { t } = useI18n();
  const { pressHandlers } = usePressFeedback();
  const metrics = getLessonStudyMetrics(lesson, progressByItem);
  const accuracy = counts.accuracy(metrics.accuracyPercent);
  return (
    <button
      type="button"
      {...pressHandlers}
      onClick={onOpen}
      aria-label={`${lesson.title}${lesson.subtitle ? `: ${lesson.subtitle}` : ''} · ${counts.items(lesson.items.length)} · ${t('metrics.accuracyValue', { percent: accuracy })}`}
      className={`flat-interactive w-full min-h-[56px] px-4 py-3 flex items-center gap-3 text-left ${FOCUS_RING} focus-visible:ring-inset focus-visible:ring-offset-0`}
    >
      <LessonTitle lesson={lesson} className="flex-1" />
      <span className="shrink-0 text-right text-sm text-text-secondary leading-snug whitespace-nowrap">
        {counts.items(lesson.items.length)}
        <span className="text-text-muted"> · </span>
        <span className={metrics.accuracyPercent === null ? 'text-text-muted' : 'font-semibold text-text-primary'}>
          {accuracy}
        </span>
      </span>
      <IconChevronRight size={18} stroke={2} aria-hidden="true" className="shrink-0 text-text-muted" />
    </button>
  );
};

/**
 * Flat list container with 1px dividers; two columns from `sm` up when `columns` is 2.
 */
export const LessonList: React.FC<{
  lessons: Lesson[];
  progressByItem: Record<string, ItemProgress>;
  onOpen: (lesson: Lesson) => void;
  columns?: 1 | 2;
  labelledBy?: string;
}> = ({ lessons, progressByItem, onOpen, columns = 2, labelledBy }) => (
  <ul
    aria-labelledby={labelledBy}
    className={`bg-surface border border-border-subtle rounded-xl overflow-hidden grid ${columns === 2 ? 'sm:grid-cols-2' : ''}`}
  >
    {lessons.map((lesson, index) => {
      const isLast = index === lessons.length - 1;
      const isLastRowOfTwo = columns === 2 && index >= lessons.length - (lessons.length % 2 === 0 ? 2 : 1);
      return (
        <li
          key={lesson.id}
          className={`${isLast ? '' : 'border-b'} ${columns === 2 ? (isLastRowOfTwo ? 'sm:border-b-0' : 'sm:border-b') : ''} border-border-subtle ${columns === 2 && index % 2 === 0 ? 'sm:border-r' : ''}`}
        >
          <LessonRow lesson={lesson} progressByItem={progressByItem} onOpen={() => onOpen(lesson)} />
        </li>
      );
    })}
  </ul>
);

/** Calm inline message for empty lists (no management actions on study screens). */
export const InlineNotice: React.FC<{ icon?: React.ReactNode; children: React.ReactNode; tone?: 'neutral' | 'warning' }> = ({
  icon,
  children,
  tone = 'neutral',
}) => (
  <div
    role={tone === 'warning' ? 'status' : undefined}
    className="w-full bg-surface-elevated border border-border-subtle rounded-xl px-4 py-3.5 shadow-clay-pressed flex items-start gap-3 text-sm text-text-secondary leading-relaxed"
  >
    {icon && (
      <span aria-hidden="true" className={`shrink-0 mt-0.5 ${tone === 'warning' ? 'text-warning' : 'text-text-muted'}`}>
        {icon}
      </span>
    )}
    <span className="min-w-0">{children}</span>
  </div>
);
