import React, { useRef, useEffect } from 'react';
import {
  IconArrowRight,
  IconBolt,
  IconBook,
  IconBooks,
  IconSettings,
  IconWriting,
} from '@tabler/icons-react';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { CLAY_PRESSED_CLASSES, usePressFeedback } from '../../hooks/usePressFeedback';
import { getCategoryStudyMetrics, StudyCollectionMetrics } from '../../lib/studyMetrics';
import { TranslationKey } from '../../lib/i18n';
import { StudyCategory } from '../../types';
import { TopBar } from '../../components/TopBar';
import { EmptyState } from '../../components/EmptyState';
import { BookCard } from './BookCard';

// Focus ring shared by Home study actions. Hover lift comes from `.clay-interactive`
// (pointer-capability gated) and pressed depth from usePressFeedback (explicit state).
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page';

// Full class strings per category so Tailwind detects them statically.
// `glyph` is the Japanese name of the category (study content, not UI locale).
const CATEGORY_TILES: Record<
  StudyCategory,
  {
    labelKey: TranslationKey;
    glyph: string;
    Icon: typeof IconBook;
    surface: string;
    puck: string;
    glyphColor: string;
    title: string;
  }
> = {
  vocabulary: {
    labelKey: 'category.vocabulary',
    glyph: '語彙',
    Icon: IconBook,
    surface: 'bg-category-vocabulary-surface border-category-vocabulary-border',
    puck: 'border-category-vocabulary-border text-category-vocabulary-icon',
    glyphColor: 'text-category-vocabulary-icon',
    title: 'text-category-vocabulary-text',
  },
  kanji: {
    labelKey: 'category.kanji',
    glyph: '漢字',
    Icon: IconWriting,
    surface: 'bg-category-kanji-surface border-category-kanji-border',
    puck: 'border-category-kanji-border text-category-kanji-icon',
    glyphColor: 'text-category-kanji-icon',
    title: 'text-category-kanji-text',
  },
};

interface CategoryTileProps {
  category: StudyCategory;
  metrics: StudyCollectionMetrics;
  onClick: () => void;
}

const CategoryTile: React.FC<CategoryTileProps> = ({ category, metrics, onClick }) => {
  const { t } = useI18n();
  const { isPressed, pressHandlers } = usePressFeedback();
  const tile = CATEGORY_TILES[category];
  const label = t(tile.labelKey);

  return (
    <button
      type="button"
      data-study-card="true"
      data-category={category}
      {...pressHandlers}
      onClick={onClick}
      aria-label={t('aria.learnCategory', { category: label })}
      className={`clay-interactive w-full text-left border rounded-2xl p-4 sm:p-5 min-h-[148px] sm:min-h-[168px] flex flex-col justify-between gap-4 ${isPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-card'} ${tile.surface} ${FOCUS_RING}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-surface border flex items-center justify-center shrink-0 shadow-clay-card ${tile.puck}`}
          aria-hidden="true"
        >
          <tile.Icon size={26} stroke={1.75} />
        </div>
        <span
          lang="ja"
          aria-hidden="true"
          className={`font-japanese font-bold leading-none text-2xl sm:text-4xl opacity-40 select-none ${tile.glyphColor}`}
        >
          {tile.glyph}
        </span>
      </div>

      <div className="min-w-0">
        <h3 className={`font-bold text-lg sm:text-xl leading-snug ${tile.title}`}>{label}</h3>
        <div className="text-xs sm:text-sm text-text-secondary mt-1 flex items-center gap-x-1.5 gap-y-0.5 flex-wrap">
          <span>
            {t(
              metrics.lessonCount === 1 ? 'metrics.lessonCount.one' : 'metrics.lessonCount.other',
              { count: metrics.lessonCount }
            )}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t(metrics.itemCount === 1 ? 'metrics.itemCount.one' : 'metrics.itemCount.other', {
              count: metrics.itemCount,
            })}
          </span>
        </div>
      </div>
    </button>
  );
};

export const HomeStudyHub: React.FC = () => {
  const { state } = useAppState();
  const { navigate } = useNavigation();
  const { t } = useI18n();
  const { isPressed: isMixedTestPressed, pressHandlers: mixedTestPressHandlers } =
    usePressFeedback();

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
        className="flex-1 w-full max-w-4xl mx-auto px-4 pt-6 pb-10 sm:pt-10 sm:pb-14 space-y-8 sm:space-y-10"
      >
        {/* Study paths: greeting sits directly above the always-available study actions */}
        <div className="space-y-5 sm:space-y-6">
          <section aria-labelledby="home-greeting-heading" className="space-y-1">
            <h1
              id="home-greeting-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug text-text-primary"
            >
              {t('home.greeting')}
            </h1>
            <p className="text-sm sm:text-base text-text-secondary">{t('home.greetingHint')}</p>
          </section>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
            {/* Learn by Type: two semantic clay tiles */}
            <section
              aria-labelledby="home-learn-by-type-heading"
              className="space-y-3 lg:col-span-2"
            >
              <h2
                id="home-learn-by-type-heading"
                className="text-sm leading-5 font-semibold tracking-wider text-text-secondary uppercase"
              >
                {t('home.learnByType')}
              </h2>

              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                <CategoryTile
                  category="vocabulary"
                  metrics={vocabMetrics}
                  onClick={() =>
                    navigate({
                      type: 'learn_by_type',
                      category: 'vocabulary',
                    })
                  }
                />
                <CategoryTile
                  category="kanji"
                  metrics={kanjiMetrics}
                  onClick={() =>
                    navigate({
                      type: 'learn_by_type',
                      category: 'kanji',
                    })
                  }
                />
              </div>
            </section>

            {/* Mixed Test: solid primary clay CTA. On desktop it becomes the third tile
                of the study row, offset by the Learn by Type heading (20px + 12px gap). */}
            <section aria-labelledby="home-mixed-test-heading" className="flex flex-col lg:pt-8">
              <button
                type="button"
                id="home-mixed-test-heading"
                data-study-card="true"
                {...mixedTestPressHandlers}
                onClick={() => navigate({ type: 'mixed_quiz_config' })}
                className={`clay-interactive relative flex-1 w-full text-left bg-cta-surface border border-cta-border text-cta-text rounded-2xl p-4 sm:p-5 min-h-[88px] flex items-center gap-4 lg:flex-col lg:items-start lg:justify-between ${isMixedTestPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-button'} ${FOCUS_RING}`}
              >
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-cta-puck-surface border border-cta-puck-border flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <IconBolt size={26} stroke={1.75} />
                </div>
                <div className="flex-1 min-w-0 lg:flex-none">
                  <h3 className="font-bold text-base sm:text-xl leading-snug text-cta-text">
                    {t('home.mixedTest')}
                  </h3>
                  <p className="text-xs sm:text-sm text-cta-text-secondary mt-0.5 leading-snug">
                    {t('home.mixedTestSubtitle')}
                  </p>
                </div>
                <div
                  className="w-9 h-9 rounded-full bg-cta-puck-surface border border-cta-puck-border flex items-center justify-center shrink-0 clay-hover-nudge transition-transform duration-150 lg:absolute lg:top-5 lg:right-5"
                  aria-hidden="true"
                >
                  <IconArrowRight size={18} stroke={2} />
                </div>
              </button>
            </section>
          </div>
        </div>

        {/* Study Books Section */}
        <section aria-labelledby="home-study-books-heading" className="space-y-3">
          <h2
            id="home-study-books-heading"
            className="text-sm leading-5 font-semibold tracking-wider text-text-secondary uppercase"
          >
            {t('home.studyBooks')}
          </h2>

          {bookList.length === 0 ? (
            <EmptyState
              icon={<IconBooks size={22} stroke={1.75} />}
              title={t('home.emptyBooks.title')}
              description={t('home.emptyBooks.description')}
              action={{
                label: t('nav.settings'),
                icon: <IconSettings size={18} stroke={2} aria-hidden="true" />,
                onClick: () => navigate({ type: 'settings' }),
              }}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
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
      </main>
    </div>
  );
};
