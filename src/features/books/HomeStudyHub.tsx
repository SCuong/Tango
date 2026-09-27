import React, { useRef, useEffect, useState } from 'react';
import {
  IconBooks,
  IconChevronDown,
  IconChevronUp,
  IconPlus,
  IconSettings,
} from '@tabler/icons-react';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { CLAY_PRESSED_CLASSES, usePressFeedback } from '../../hooks/usePressFeedback';
import { TranslationKey } from '../../lib/i18n';
import { StudyCategory } from '../../types';
import { TopBar } from '../../components/TopBar';
import { ThemeAmbience } from '../../components/ThemeAmbience';
import { EmptyState } from '../../components/EmptyState';
import { VocabularyIllustration } from '../../components/illustrations/VocabularyIllustration';
import { KanjiIllustration } from '../../components/illustrations/KanjiIllustration';
import { IllustrationProps } from '../../components/illustrations/StudyCardIllustration';
import { BookCard } from './BookCard';

// Home previews only the first books; the rest are revealed in place by "View all".
// Reordering belongs to the future full Books list / management view, never to Home.
const HOME_BOOK_PREVIEW_COUNT = 2;

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
      className={`clay-interactive relative w-full h-full text-left border rounded-2xl p-4 sm:p-5 min-h-[112px] sm:min-h-[128px] flex flex-col justify-between gap-3 overflow-hidden ${isPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-card'} ${tile.surface} ${FOCUS_RING}`}
    >
      {/* Glyph pinned top-left (never wraps), label pinned bottom-left, illustration top-right */}
      <span
        lang="ja"
        aria-hidden="true"
        className={`font-japanese font-bold leading-none whitespace-nowrap text-2xl min-[380px]:text-[1.75rem] sm:text-4xl tracking-normal min-[380px]:tracking-wide select-none ${tile.glyphColor}`}
      >
        {tile.glyph}
      </span>
      <h3 className={`font-semibold text-sm sm:text-base leading-snug whitespace-nowrap truncate ${tile.title}`}>{label}</h3>
      <tile.Illustration className={`absolute top-2.5 right-2 w-12 h-12 min-[380px]:w-14 min-[380px]:h-14 sm:top-3 sm:right-3 sm:w-20 sm:h-20 ${tile.glyphColor}`} />
    </button>
  );
};

export const HomeStudyHub: React.FC = () => {
  const { state } = useAppState();
  const { navigate } = useNavigation();
  const { t } = useI18n();
  const { isPressed: isMixedTestPressed, pressHandlers: mixedTestPressHandlers } =
    usePressFeedback();
  const [showAllBooks, setShowAllBooks] = useState(false);

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
  const previewBooks = bookList.slice(0, HOME_BOOK_PREVIEW_COUNT);
  const moreBooks = bookList.slice(HOME_BOOK_PREVIEW_COUNT);

  const renderBookCard = (book: (typeof bookList)[number]) => (
    <BookCard
      key={book.id}
      book={book}
      lessons={state.lessons}
      progressByItem={state.progressByItem}
      onClick={() => navigate({ type: 'book_study', bookId: book.id })}
    />
  );

  return (
    <div className="min-h-screen bg-page text-text-primary flex flex-col">
      {/* Restrained per-theme Japanese ambience, behind all content */}
      <ThemeAmbience />

      {/* Top Bar: TANGO wordmark and Settings only */}
      <TopBar />

      {/* Main Home study canvas: Study Books first, then category shortcuts, then Mixed Test */}
      <main
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className="relative flex-1 w-full max-w-4xl mx-auto px-4 pt-4 pb-10 sm:pt-6 sm:pb-14 space-y-6 sm:space-y-8"
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
            <>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {previewBooks.map(renderBookCard)}
              </div>

              {moreBooks.length > 0 && (
                <>
                  {showAllBooks && (
                    <div id="home-more-books" className="grid gap-3 sm:grid-cols-2 sm:gap-4 mt-3 sm:mt-4">
                      {moreBooks.map(renderBookCard)}
                    </div>
                  )}
                  <div className="flex justify-center mt-3 sm:mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAllBooks((value) => !value)}
                      aria-expanded={showAllBooks}
                      aria-controls="home-more-books"
                      className={`inline-flex items-center justify-center gap-1.5 w-[62%] sm:w-auto sm:px-10 min-h-touch rounded-2xl border border-dashed border-border-strong text-sm font-semibold text-text-secondary ${FOCUS_RING}`}
                    >
                      {t(showAllBooks ? 'home.showFewerBooks' : 'home.viewAllBooks')}
                      {showAllBooks ? (
                        <IconChevronUp size={18} stroke={2} aria-hidden="true" />
                      ) : (
                        <IconChevronDown size={18} stroke={2} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </>
              )}
            </>
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

          {/* Test CTA: short label plus a "+" affordance (creates/configures a test) */}
          <section aria-labelledby="home-mixed-test-heading">
            <button
              type="button"
              id="home-mixed-test-heading"
              data-study-card="true"
              {...mixedTestPressHandlers}
              onClick={() => navigate({ type: 'mixed_quiz_config' })}
              aria-label={t('aria.createTest')}
              className={`clay-interactive w-full h-full text-left bg-cta-surface border border-cta-border text-cta-text rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 min-h-[72px] flex items-center justify-between gap-3 ${isMixedTestPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-button'} ${FOCUS_RING}`}
            >
              <h3 className="font-bold text-base sm:text-lg leading-snug text-cta-text">
                {t('home.test')}
              </h3>
              <span
                className="w-10 h-10 rounded-full bg-cta-puck-surface border border-cta-puck-border flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <IconPlus size={22} stroke={2.25} />
              </span>
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};
