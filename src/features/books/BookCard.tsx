import React from 'react';
import { StudyBook, Lesson, ItemProgress } from '../../types';
import { getBookStudyMetrics } from '../../lib/studyMetrics';
import { useI18n } from '../../hooks/useI18n';
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
  const metrics = getBookStudyMetrics(book.id, lessons, progressByItem);

  return (
    <button
      type="button"
      onClick={onClick}
      data-study-card="true"
      aria-label={t('aria.openBook', { title: book.title })}
      className={`w-full text-left bg-surface border border-border-subtle rounded-2xl p-3 sm:p-4 shadow-clay-card hover:shadow-clay-card-hover hover:-translate-y-px active:translate-y-px active:shadow-clay-pressed transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page flex items-stretch gap-3.5 sm:gap-4 min-h-[56px] ${className}`}
    >
      {/* 3:4 book cover thumbnail */}
      <div className="w-14 sm:w-16 aspect-[3/4] rounded-lg overflow-hidden shrink-0 border border-border-subtle shadow-clay-card self-center">
        <BookCover coverImageId={book.coverImageId} title={book.title} />
      </div>

      {/* Book information */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <h3 className="font-bold text-text-primary text-base leading-snug line-clamp-2">
          {book.title}
        </h3>

        {/* Metadata row */}
        <div className="text-xs sm:text-sm text-text-secondary flex items-center gap-1.5 flex-wrap">
          <span>
            {t(
              metrics.lessonCount === 1
                ? 'metrics.lessonCount.one'
                : 'metrics.lessonCount.other',
              { count: metrics.lessonCount }
            )}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t(
              metrics.itemCount === 1
                ? 'metrics.itemCount.one'
                : 'metrics.itemCount.other',
              { count: metrics.itemCount }
            )}
          </span>
        </div>

        {/* Study Coverage row */}
        <div className="flex items-center gap-2 pt-1">
          <ProgressBar
            value={metrics.coveragePercent}
            ariaLabel={t('aria.progressCoverage', { percent: metrics.coveragePercent })}
          />
          <span className="text-xs font-semibold text-text-secondary min-w-[2.5rem] text-right">
            {t('metrics.coverage', { percent: metrics.coveragePercent })}
          </span>
        </div>
      </div>
    </button>
  );
};
