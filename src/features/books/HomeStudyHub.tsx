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
      className={`clay-interactive w-full h-full text-left border rounded-2xl p-3 sm:p-4 min-h-[72px] flex items-center gap-3 ${isPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-card'} ${tile.surface} ${FOCUS_RING}`}
    >
      <div
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-surface border flex items-center justify-center shrink-0 shadow-clay-card ${tile.puck}`}
        aria-hidden="true"
      >
        <tile.Icon size={22} stroke={1.75} />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`font-bold text-base leading-snug ${tile.title}`}>{label}</h3>
        <div className="text-xs text-text-secondary flex items-center gap-x-1.5 gap-y-0.5 flex-wrap">
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

      <span
        lang="ja"
        aria-hidden="true"
        className={`hidden sm:block font-japanese font-bold leading-none text-2xl opacity-40 select-none shrink-0 ${tile.glyphColor}`}
      >
        {tile.glyph}
      </span>
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

      {/* Main Home study canvas: Study Books first, then category shortcuts, then Mixed Test */}
      <main
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full max-w-4xl mx-auto px-4 pt-5 pb-10 sm:pt-8 sm:pb-14 space-y-6 sm:space-y-8"
      >
        <h1 className="sr-only">{t('nav.home')}</h1>

        {/* Study Books: primary content */}
        <section aria-labelledby="home-study-books-heading">
          <h2 id="home-study-books-heading" className="sr-only">
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
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
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

        {/* Secondary shortcuts: Vocabulary / Kanji, then Mixed Test */}
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[3fr_2fr]">
          <section aria-labelledby="home-learn-by-type-heading">
            <h2 id="home-learn-by-type-heading" className="sr-only">
              {t('home.learnByType')}
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 h-full">
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

          {/* Mixed Test: compact solid CTA, visually below the books in hierarchy */}
          <section aria-labelledby="home-mixed-test-heading">
            <button
              type="button"
              id="home-mixed-test-heading"
              data-study-card="true"
              {...mixedTestPressHandlers}
              onClick={() => navigate({ type: 'mixed_quiz_config' })}
              className={`clay-interactive w-full h-full text-left bg-cta-surface border border-cta-border text-cta-text rounded-2xl p-3 sm:p-4 min-h-[72px] flex items-center gap-3 ${isMixedTestPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-button'} ${FOCUS_RING}`}
            >
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-cta-puck-surface border border-cta-puck-border flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <IconBolt size={22} stroke={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base leading-snug text-cta-text">
                  {t('home.mixedTest')}
                </h3>
                <p className="text-xs text-cta-text-secondary leading-snug line-clamp-2">
                  {t('home.mixedTestSubtitle')}
                </p>
              </div>
              <div
                className="w-8 h-8 rounded-full bg-cta-puck-surface border border-cta-puck-border flex items-center justify-center shrink-0 clay-hover-nudge transition-transform duration-150"
                aria-hidden="true"
              >
                <IconArrowRight size={16} stroke={2} />
              </div>
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};
