import React, { useRef, useEffect } from 'react';
import { IconArrowRight, IconBooks, IconSettings } from '@tabler/icons-react';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { CLAY_PRESSED_CLASSES, usePressFeedback } from '../../hooks/usePressFeedback';
import { TranslationKey } from '../../lib/i18n';
import { StudyCategory } from '../../types';
import { TopBar } from '../../components/TopBar';
import { EmptyState } from '../../components/EmptyState';
import { VocabularyIllustration } from '../../components/illustrations/VocabularyIllustration';
import { KanjiIllustration } from '../../components/illustrations/KanjiIllustration';
import { IllustrationProps } from '../../components/illustrations/StudyCardIllustration';
import { BookCard } from './BookCard';

// Focus ring shared by Home study actions. Hover lift comes from `.clay-interactive`
// (pointer-capability gated) and pressed depth from usePressFeedback (explicit state).
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page';

// Full class strings per category so Tailwind detects them statically.
// `glyph` is the Japanese name of the category (study content, not UI locale); the localized
// label sits under it. `glyphColor` also drives the illustration through `currentColor`.
const CATEGORY_TILES: Record<
  StudyCategory,
  {
    labelKey: TranslationKey;
    glyph: string;
    Illustration: React.FC<IllustrationProps>;
    surface: string;
    glyphColor: string;
    title: string;
  }
> = {
  vocabulary: {
    labelKey: 'category.vocabulary',
    glyph: '語彙',
    Illustration: VocabularyIllustration,
    surface: 'bg-category-vocabulary-surface border-category-vocabulary-border',
    glyphColor: 'text-category-vocabulary-icon',
    title: 'text-category-vocabulary-text',
  },
  kanji: {
    labelKey: 'category.kanji',
    glyph: '漢字',
    Illustration: KanjiIllustration,
    surface: 'bg-category-kanji-surface border-category-kanji-border',
    glyphColor: 'text-category-kanji-icon',
    title: 'text-category-kanji-text',
  },
};

interface CategoryTileProps {
  category: StudyCategory;
  onClick: () => void;
}

// Secondary navigation shortcut: Japanese glyph + localized category name with a decorative
// category illustration. No counts.
const CategoryTile: React.FC<CategoryTileProps> = ({ category, onClick }) => {
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
      className={`clay-interactive w-full h-full text-left border rounded-2xl pl-4 pr-2 py-3 sm:pl-5 sm:pr-3 min-h-[72px] flex items-center justify-between gap-2 ${isPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-card'} ${tile.surface} ${FOCUS_RING}`}
    >
      <div className="min-w-0 flex flex-col gap-1.5">
        <span
          lang="ja"
          aria-hidden="true"
          className={`font-japanese font-bold leading-none text-2xl sm:text-3xl tracking-wide select-none ${tile.glyphColor}`}
        >
          {tile.glyph}
        </span>
        <h3 className={`font-semibold text-sm sm:text-base leading-snug ${tile.title}`}>{label}</h3>
      </div>
      <tile.Illustration className={`w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] shrink-0 ${tile.glyphColor}`} />
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
                onClick={() =>
                  navigate({
                    type: 'learn_by_type',
                    category: 'vocabulary',
                  })
                }
              />
              <CategoryTile
                category="kanji"
                onClick={() =>
                  navigate({
                    type: 'learn_by_type',
                    category: 'kanji',
                  })
                }
              />
            </div>
          </section>

          {/* Mixed Test: concise solid CTA (title + trailing arrow), below the books in hierarchy */}
          <section aria-labelledby="home-mixed-test-heading">
            <button
              type="button"
              id="home-mixed-test-heading"
              data-study-card="true"
              {...mixedTestPressHandlers}
              onClick={() => navigate({ type: 'mixed_quiz_config' })}
              className={`clay-interactive w-full h-full text-left bg-cta-surface border border-cta-border text-cta-text rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 min-h-[72px] flex items-center justify-between gap-3 ${isMixedTestPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-button'} ${FOCUS_RING}`}
            >
              <h3 className="font-bold text-base sm:text-lg leading-snug text-cta-text">
                {t('home.mixedTest')}
              </h3>
              <IconArrowRight
                size={22}
                stroke={2}
                aria-hidden="true"
                className="shrink-0 clay-hover-nudge transition-transform duration-150"
              />
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};
