import React, { useRef, useEffect } from 'react';
import { IconBook, IconWriting, IconBolt } from '@tabler/icons-react';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { getCategoryStudyMetrics } from '../../lib/studyMetrics';
import { TopBar } from '../../components/TopBar';
import { EmptyState } from '../../components/EmptyState';
import { BookCard } from './BookCard';

export const HomeStudyHub: React.FC = () => {
  const { state } = useAppState();
  const { navigate } = useNavigation();
  const { t } = useI18n();

  const containerRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut: Alt+S -> Settings
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        navigate({ type: 'settings' });
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [navigate]);

  // Narrow arrow-key card navigation for the registered Home study-action collection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    if (
      e.key !== 'ArrowDown' &&
      e.key !== 'ArrowRight' &&
      e.key !== 'ArrowUp' &&
      e.key !== 'ArrowLeft'
    ) {
      return;
    }

    const cards = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>('[data-study-card="true"]')
    );

    const activeEl =
      typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null;
    const currentIndex = activeEl ? cards.indexOf(activeEl) : -1;

    // Do not intercept if focus is not on one of the registered study cards/actions
    if (currentIndex === -1) {
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = Math.min(currentIndex + 1, cards.length - 1);
      cards[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = Math.max(currentIndex - 1, 0);
      cards[prevIndex]?.focus();
    }
  };

  const bookList = Object.values(state.books);
  const vocabMetrics = getCategoryStudyMetrics(
    'vocabulary',
    state.lessons,
    state.progressByItem
  );
  const kanjiMetrics = getCategoryStudyMetrics(
    'kanji',
    state.lessons,
    state.progressByItem
  );

  return (
    <div className="min-h-screen bg-page text-text-primary flex flex-col">
      {/* Top Bar with TANGO wordmark, active theme indicator, and Settings button */}
      <TopBar />

      {/* Main Home study canvas */}
      <main
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-7 sm:space-y-8"
      >
        {/* Greeting Section */}
        <section aria-labelledby="home-greeting-heading">
          <h1
            id="home-greeting-heading"
            className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary"
          >
            {t('home.greeting')}
          </h1>
        </section>

        {/* Study Books Section */}
        <section aria-labelledby="home-study-books-heading" className="space-y-3">
          <h2
            id="home-study-books-heading"
            className="text-xs sm:text-sm font-semibold tracking-wider text-text-muted uppercase"
          >
            {t('home.studyBooks')}
          </h2>

          {bookList.length === 0 ? (
            <EmptyState
              icon={<IconBook size={24} stroke={1.5} aria-hidden="true" />}
              title={t('home.emptyBooks.title')}
              description={t('home.emptyBooks.description')}
              action={{
                label: t('nav.settings'),
                onClick: () => navigate({ type: 'settings' }),
              }}
            />
          ) : (
            <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4">
              {bookList.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  lessons={state.lessons}
                  progressByItem={state.progressByItem}
                  onClick={() => navigate({ type: 'book_study', bookId: book.id })}
                />
              ))}
            </div>
          )}
        </section>

        {/* Learn by Type Section */}
        <section aria-labelledby="home-learn-by-type-heading" className="space-y-3">
          <h2
            id="home-learn-by-type-heading"
            className="text-xs sm:text-sm font-semibold tracking-wider text-text-muted uppercase"
          >
            {t('home.learnByType')}
          </h2>

          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4">
            {/* Vocabulary Card */}
            <button
              type="button"
              data-study-card="true"
              onClick={() =>
                navigate({
                  type: 'learn_by_type',
                  category: 'vocabulary',
                })
              }
              aria-label={t('aria.learnCategory', {
                category: t('category.vocabulary'),
              })}
              className="w-full text-left bg-surface border border-border-subtle rounded-2xl p-4 shadow-clay-card hover:shadow-md transition-all duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-4 min-h-[56px]"
            >
              <div
                className="w-12 h-12 rounded-xl bg-primary-surface text-primary flex items-center justify-center shrink-0 border border-border-subtle"
                aria-hidden="true"
              >
                <IconBook size={24} stroke={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-primary text-base sm:text-lg">
                  {t('category.vocabulary')}
                </h3>
                <div className="text-xs sm:text-sm text-text-secondary mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>
                    {t(
                      vocabMetrics.lessonCount === 1
                        ? 'metrics.lessonCount.one'
                        : 'metrics.lessonCount.other',
                      { count: vocabMetrics.lessonCount }
                    )}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {t(
                      vocabMetrics.itemCount === 1
                        ? 'metrics.itemCount.one'
                        : 'metrics.itemCount.other',
                      { count: vocabMetrics.itemCount }
                    )}
                  </span>
                </div>
              </div>
            </button>

            {/* Kanji Card */}
            <button
              type="button"
              data-study-card="true"
              onClick={() =>
                navigate({
                  type: 'learn_by_type',
                  category: 'kanji',
                })
              }
              aria-label={t('aria.learnCategory', {
                category: t('category.kanji'),
              })}
              className="w-full text-left bg-surface border border-border-subtle rounded-2xl p-4 shadow-clay-card hover:shadow-md transition-all duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-4 min-h-[56px]"
            >
              <div
                className="w-12 h-12 rounded-xl bg-surface-elevated text-text-primary flex items-center justify-center shrink-0 border border-border-subtle"
                aria-hidden="true"
              >
                <IconWriting size={24} stroke={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-primary text-base sm:text-lg">
                  {t('category.kanji')}
                </h3>
                <div className="text-xs sm:text-sm text-text-secondary mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>
                    {t(
                      kanjiMetrics.lessonCount === 1
                        ? 'metrics.lessonCount.one'
                        : 'metrics.lessonCount.other',
                      { count: kanjiMetrics.lessonCount }
                    )}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {t(
                      kanjiMetrics.itemCount === 1
                        ? 'metrics.itemCount.one'
                        : 'metrics.itemCount.other',
                      { count: kanjiMetrics.itemCount }
                    )}
                  </span>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Mixed Test Action Bar */}
        <section aria-labelledby="home-mixed-test-heading">
          <button
            type="button"
            id="home-mixed-test-heading"
            data-study-card="true"
            onClick={() => navigate({ type: 'mixed_quiz_config' })}
            className="w-full text-left bg-surface border border-border-subtle rounded-2xl p-4 sm:p-5 shadow-clay-card hover:shadow-md transition-all duration-150 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-4 min-h-[56px]"
          >
            <div
              className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-clay-button"
              aria-hidden="true"
            >
              <IconBolt size={24} stroke={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-text-primary text-base sm:text-lg">
                {t('home.mixedTest')}
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5 truncate sm:whitespace-normal">
                {t('home.mixedTestSubtitle')}
              </p>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
};
