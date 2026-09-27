import React from 'react';
import { StudyBook, Lesson, ItemProgress } from '../../types';
import { getBookStudyMetrics } from '../../lib/studyMetrics';
import { useI18n } from '../../hooks/useI18n';
import { CLAY_PRESSED_CLASSES, usePressFeedback } from '../../hooks/usePressFeedback';
import { BookCover } from './BookCover';
import { ProgressBar } from '../../components/ProgressBar';

export interface BookCardProps {
  book: StudyBook;
  lessons: Record<string, Lesson>;
  progressByItem: Record<string, ItemProgress>;
  onClick: () => void;
  className?: string;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  lessons,
  progressByItem,
  onClick,
  className = '',
}) => {
  const { t } = useI18n();
  const { isPressed, pressHandlers } = usePressFeedback();
  const metrics = getBookStudyMetrics(book.id, lessons, progressByItem);

  return (
    <button
      type="button"
      {...pressHandlers}
      onClick={onClick}
      data-study-card="true"
      aria-label={t('aria.openBook', { title: book.title })}
      title={book.title}
      className={`clay-interactive w-full h-full text-left bg-surface border border-border-subtle rounded-2xl p-4 sm:p-5 ${isPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-card'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page flex items-stretch gap-4 sm:gap-6 ${className}`}
    >
      {/* Primary 3:4 book cover */}
      <div className="w-24 sm:w-28 lg:w-32 aspect-[3/4] rounded-xl overflow-hidden shrink-0 border border-border-subtle shadow-clay-card self-start">
        <BookCover coverImageId={book.coverImageId} title={book.title} />
      </div>

      {/* Book information */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-4 py-1">
        <h3 className="font-study-title font-bold text-text-primary text-lg sm:text-xl leading-snug line-clamp-3 break-words">
          {book.title}
        </h3>

        {/* Study Coverage row */}
        <div className="flex items-center gap-2.5">
          <ProgressBar
            value={metrics.coveragePercent}
            ariaLabel={t('aria.progressCoverage', { percent: metrics.coveragePercent })}
          />
          <span className="text-sm font-semibold text-text-primary min-w-[2.75rem] text-right">
            {t('metrics.coverage', { percent: metrics.coveragePercent })}
          </span>
        </div>
      </div>
    </button>
  );
};
