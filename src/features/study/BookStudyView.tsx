import React from 'react';
import { IconBolt, IconBooks, IconChevronRight } from '@tabler/icons-react';
import { StudyCategory } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { useCounts } from '../../hooks/useCounts';
import { CLAY_PRESSED_CLASSES, usePressFeedback } from '../../hooks/usePressFeedback';
import { getBookStudyMetrics, getCategoryStudyMetrics } from '../../lib/studyMetrics';
import { STUDY_CATEGORIES } from '../../lib/studySelectors';
import { Screen, ScreenHeader, SectionLabel, StickyBottomBar } from '../../components/Screen';
import { Button, FOCUS_RING } from '../../components/Button';
import { ProgressBar } from '../../components/ProgressBar';
import { BookCover } from '../books/BookCover';
import { CATEGORY_GLYPHS, CATEGORY_LABEL_KEYS, CATEGORY_SURFACE_CLASSES, InlineNotice } from './StudyParts';
import { NotFoundScreen } from '../../components/NotFoundScreen';

/**
 * SCREEN 02 — Book Study View (`/book/:bookId`).
 * Book identity + Study Coverage, the two category entry cards, and the book test CTA.
 * Zero destructive or editing controls (CONTENT_LIBRARY_SPEC §6).
 */
export const BookStudyView: React.FC<{ bookId: string }> = ({ bookId }) => {
  const { state } = useAppState();
  const { navigate, goUp } = useNavigation();
  const { t } = useI18n();
  const counts = useCounts();
  const book = state.books[bookId];
  const goHome = () => goUp({ type: 'home' });

  if (!book) {
    return <NotFoundScreen message={t('common.notFound.book')} onBack={goHome} />;
  }

  const metrics = getBookStudyMetrics(book.id, state.lessons, state.progressByItem);
  const hasLessons = metrics.lessonCount > 0;

  const testButton = (
    <Button
      variant="primary"
      size="lg"
      fullWidth
      icon={<IconBolt size={20} stroke={2} />}
      disabled={!hasLessons}
      onClick={() => navigate({ type: 'book_quiz_config', bookId: book.id })}
    >
      {t('book.test')}
    </Button>
  );

  return (
    <Screen
      ambience
      width="2xl"
      onEscape={goHome}
      header={<ScreenHeader title={t('book.header')} onBack={goHome} width="2xl" />}
      bottomBar={<StickyBottomBar width="2xl">{testButton}</StickyBottomBar>}
    >
      {/* Book identity: cover, title, inventory and Study Coverage */}
      <section className="bg-surface border border-border-subtle rounded-2xl shadow-clay-card p-4 sm:p-6 flex gap-4 sm:gap-6">
        <div className="w-20 sm:w-28 aspect-[3/4] rounded-xl overflow-hidden shrink-0 border border-border-subtle shadow-clay-card self-start">
          <BookCover coverImageId={book.coverImageId} title={book.title} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <h2 className="font-study-title font-bold text-text-primary text-lg sm:text-2xl leading-snug break-words">
            {book.title}
          </h2>
          <p className="text-sm text-text-secondary leading-snug">
            {t('metrics.lessonsAndItems', {
              lessons: counts.lessons(metrics.lessonCount),
              items: counts.items(metrics.itemCount),
            })}
          </p>
          <div className="mt-auto flex items-center gap-2.5">
            <ProgressBar
              value={metrics.coveragePercent}
              ariaLabel={t('aria.progressCoverage', { percent: metrics.coveragePercent })}
            />
            <span className="text-sm font-semibold text-text-primary whitespace-nowrap">
              {t('metrics.coverageValue', { percent: metrics.coveragePercent })}
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="book-categories-heading" className="mt-6 sm:mt-8">
        <SectionLabel id="book-categories-heading" className="mb-3">
          {t('book.categories')}
        </SectionLabel>
        {!hasLessons && (
          <div className="mb-3">
            <InlineNotice icon={<IconBooks size={18} stroke={2} />}>{t('quizConfig.noLessonsInScope')}</InlineNotice>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {STUDY_CATEGORIES.map((category) => (
            <CategoryEntryCard
              key={category}
              category={category}
              bookId={book.id}
              onOpen={() => navigate({ type: 'category_inside_book', bookId: book.id, category })}
            />
          ))}
        </div>
      </section>
    </Screen>
  );
};

const CategoryEntryCard: React.FC<{ category: StudyCategory; bookId: string; onOpen: () => void }> = ({
  category,
  bookId,
  onOpen,
}) => {
  const { state } = useAppState();
  const { t } = useI18n();
  const counts = useCounts();
  const { isPressed, pressHandlers } = usePressFeedback();
  const metrics = getCategoryStudyMetrics(category, state.lessons, state.progressByItem, bookId);
  const tone = CATEGORY_SURFACE_CLASSES[category];
  const label = t(CATEGORY_LABEL_KEYS[category]);
  const disabled = metrics.lessonCount === 0;

  return (
    <button
      type="button"
      disabled={disabled}
      {...(disabled ? {} : pressHandlers)}
      onClick={onOpen}
      aria-label={t('book.openCategoryAria', { category: label })}
      className={`clay-interactive relative w-full text-left border rounded-2xl p-4 sm:p-5 min-h-[112px] flex flex-col justify-between gap-4 ${tone.surface} ${disabled ? 'opacity-60 cursor-not-allowed shadow-clay-pressed' : isPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-card'} ${FOCUS_RING}`}
    >
      <span className="flex items-baseline gap-3 min-w-0">
        <span
          lang="ja"
          aria-hidden="true"
          className={`font-japanese font-bold text-2xl sm:text-3xl leading-none whitespace-nowrap ${tone.glyph}`}
        >
          {CATEGORY_GLYPHS[category]}
        </span>
        <span className={`font-semibold text-base sm:text-lg leading-snug truncate ${tone.text}`}>{label}</span>
      </span>
      <span className="flex items-end justify-between gap-3">
        <span className={`text-sm leading-snug ${tone.text}`}>
          {disabled
            ? t('book.emptyCategory')
            : t('metrics.lessonsAndItems', {
                lessons: counts.lessons(metrics.lessonCount),
                items: counts.items(metrics.itemCount),
              })}
        </span>
        {!disabled && (
          <span
            aria-hidden="true"
            className={`inline-flex items-center gap-1 shrink-0 text-sm font-semibold whitespace-nowrap ${tone.text}`}
          >
            {t('book.openCategory')}
            <IconChevronRight size={18} stroke={2} className="clay-hover-nudge transition-transform" />
          </span>
        )}
      </span>
    </button>
  );
};
