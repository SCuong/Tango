import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { AppStateProvider } from '../../../hooks/useAppState';
import { NavigationProvider } from '../../../hooks/useNavigation';
import { HomeStudyHub } from '../HomeStudyHub';
import { BookCover } from '../BookCover';
import { ProgressBar } from '../../../components/ProgressBar';
import { UserStudyState, StudyBook, Lesson } from '../../../types';
import {
  CLAY_PRESSED_CLASSES,
  isPointInsideRect,
  shouldStartPress,
} from '../../../hooks/usePressFeedback';

describe('SCREEN 01 — Home / Study Hub (SSR)', () => {
  const mockBook1: StudyBook = {
    id: 'book-01',
    title: 'Chūkyū e Ikō',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const mockLesson1: Lesson = {
    id: 'lesson-01',
    bookId: 'book-01',
    category: 'vocabulary',
    title: 'Bài 1: Từ vựng',
    items: [
      { id: 'item-01', japanese: '旅行', kana: 'りょこう', vietnamese: ['du lịch'] },
      { id: 'item-02', japanese: '案内', kana: 'あんない', vietnamese: ['hướng dẫn'] },
    ],
  };

  const mockLesson2: Lesson = {
    id: 'lesson-02',
    bookId: 'book-01',
    category: 'kanji',
    title: 'Bài 1: Hán tự',
    items: [
      { id: 'item-03', japanese: '新', kana: 'しん', vietnamese: ['mới'] },
      { id: 'item-04', japanese: '古', kana: 'こ', vietnamese: ['cũ'] },
    ],
  };

  const mockUnassignedLesson: Lesson = {
    id: 'lesson-unassigned',
    category: 'vocabulary',
    title: 'Từ vựng giao tiếp tự do',
    items: [
      { id: 'item-05', japanese: '挨拶', kana: 'あいさつ', vietnamese: ['chào hỏi'] },
      { id: 'item-06', japanese: '電話', kana: 'でんわ', vietnamese: ['điện thoại'] },
      { id: 'item-07', japanese: '感謝', kana: 'かんしゃ', vietnamese: ['cảm ơn'] },
    ],
  };

  const populatedState: UserStudyState = {
    version: 1,
    preferences: {
      theme: 'light',
      language: 'vi',
      soundEnabled: false,
    },
    books: {
      'book-01': mockBook1,
    },
    lessons: {
      'lesson-01': mockLesson1,
      'lesson-02': mockLesson2,
      'lesson-unassigned': mockUnassignedLesson,
    },
    progressByItem: {
      // 3 items attempted out of 4 total in book-01 -> 75% coverage
      // Notice: item-01 has 1 correct, item-02 and item-03 have 0 correct (low accuracy)
      // but coverage MUST remain strictly 3/4 = 75%
      'item-01': {
        itemId: 'item-01',
        totalAttempts: 5,
        correctCount: 5,
        incorrectCount: 0,
        lastStudiedAt: '2026-01-02T00:00:00.000Z',
        isMarkedWeak: false,
      },
      'item-02': {
        itemId: 'item-02',
        totalAttempts: 2,
        correctCount: 0,
        incorrectCount: 2,
        lastStudiedAt: '2026-01-02T00:00:00.000Z',
        isMarkedWeak: true,
      },
      'item-03': {
        itemId: 'item-03',
        totalAttempts: 1,
        correctCount: 0,
        incorrectCount: 1,
        lastStudiedAt: '2026-01-02T00:00:00.000Z',
        isMarkedWeak: true,
      },
      // item-04 is unattempted (0 attempts)
    },
    recentResults: [],
  };

  const renderHome = (state: UserStudyState) => {
    return renderToString(
      <AppStateProvider initialState={state}>
        <NavigationProvider initialPath="/">
          <HomeStudyHub />
        </NavigationProvider>
      </AppStateProvider>
    );
  };

  // Inventory statistics (lesson/item counts) belong on detail screens, never on Home.
  // Matches rendered text only (between tags), so CSS classes like `items-center` are ignored.
  const COUNT_PATTERN = />[^<]*\d+\s*(?:bài|mục|lessons?|items?)(?![\p{L}-])[^<]*</u;

  it('renders Vietnamese Home with book title, Study Coverage, shortcuts, and Mixed Test only', () => {
    const html = renderHome(populatedState);

    // 1. No visible greeting
    expect(html).not.toContain('Bạn muốn học gì hôm nay?');

    // 2. TopBar wordmark and Settings
    expect(html).toContain('TANGO');
    expect(html).toContain('min-h-touch');
    expect(html).toContain('aria-label="Cài đặt"');

    // 3. Book title and Study Coverage (3 studied out of 4 items = 75%)
    expect(html).toContain('Chūkyū e Ikō');
    expect(html).toContain('75%');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="75"');

    // 4. Category shortcuts: Japanese glyph + localized name
    expect(html).toContain('語彙');
    expect(html).toContain('Từ vựng');
    expect(html).toContain('漢字');
    expect(html).toContain('Hán tự');

    // 5. Mixed Test action without its explanatory subtitle
    expect(html).toContain('>Kiểm tra</h3>');
    expect(html).not.toContain('Tùy chọn nhiều bài học trên tất cả giáo trình để kiểm tra');

    // 6. No lesson/item counts anywhere on Home
    expect(html).not.toMatch(COUNT_PATTERN);
  });

  it('preserves an interactive TANGO wordmark button with 48px minimum touch-target class', () => {
    const html = renderHome(populatedState);

    expect(html).toContain('TANGO');
    expect(html).toContain('min-h-touch');
    expect(html).toMatch(/<button[^>]*class="[^"]*min-h-touch[^"]*"[^>]*>[^<]*TANGO[^<]*<\/button>/);
  });

  it('renders English Home labels without counts or the Mixed Test subtitle', () => {
    const enState: UserStudyState = {
      ...populatedState,
      preferences: {
        ...populatedState.preferences,
        language: 'en',
        theme: 'dark',
      },
    };

    const html = renderHome(enState);

    // No visible greeting and no theme status in the TopBar
    expect(html).not.toContain('What would you like to learn today?');
    expect(html).not.toContain('Current theme');
    expect(html).toContain('aria-label="Settings"');

    // Screen-reader section headings and localized labels
    expect(html).toContain('Study Books');
    expect(html).toContain('Learn by Type');
    expect(html).toContain('>Test</h3>');
    expect(html).toContain('aria-label="Create test"');
    expect(html).toContain('Vocabulary');
    expect(html).toContain('Kanji');
    expect(html).toContain('aria-label="Learn by type: Vocabulary"');
    expect(html).toContain('aria-label="Learn by type: Kanji"');

    expect(html).not.toContain('Select multiple lessons across all study books to test');
    expect(html).not.toMatch(COUNT_PATTERN);
  });

  it('renders calm empty state when no books exist, without add/import/delete controls', () => {
    const emptyBooksState: UserStudyState = {
      ...populatedState,
      books: {},
      lessons: {
        'lesson-unassigned': mockUnassignedLesson,
      },
    };

    const html = renderHome(emptyBooksState);

    // 1. Documented empty book messages appear
    expect(html).toContain('Chưa có giáo trình nào.');
    expect(html).toContain('Bạn có thể thêm giáo trình trong: Cài đặt → Quản lý nội dung.');

    // 2. Safe navigation action to Settings exists
    expect(html).toContain('Cài đặt');

    // 3. Strict Safety Guard: NO administrative controls on Home
    expect(html).not.toContain('+ Add Book');
    expect(html).not.toContain('Thêm giáo trình');
    expect(html).not.toContain('Nhập bài');
    expect(html).not.toContain('Xóa');
    expect(html).not.toContain('Delete');
    expect(html).not.toContain('Edit');

    // 4. Category shortcuts and Mixed Test remain available, still without counts
    expect(html).toContain('Từ vựng');
    expect(html).toContain('Hán tự');
    expect(html).toContain('>Kiểm tra</h3>');
    expect(html).not.toMatch(COUNT_PATTERN);
  });

  it('keeps book Study Coverage scoped to the book when unassigned lessons have progress', () => {
    const html = renderHome({
      ...populatedState,
      progressByItem: {
        ...populatedState.progressByItem,
        // Progress on the unassigned lesson must not change book-01 coverage
        'item-05': {
          itemId: 'item-05',
          totalAttempts: 4,
          correctCount: 4,
          incorrectCount: 0,
          lastStudiedAt: '2026-01-02T00:00:00.000Z',
          isMarkedWeak: false,
        },
      },
    });

    expect(html).toContain('aria-valuenow="75"');
    expect(html).toContain('75%');
  });

  it('renders coverage as exactly 75% for 3 out of 4 attempted items regardless of answer accuracy', () => {
    // Only book-01, 4 items total, exactly 3 items attempted with 0 correct answers (0% accuracy)
    const zeroAccuracyState: UserStudyState = {
      ...populatedState,
      progressByItem: {
        'item-01': {
          itemId: 'item-01',
          totalAttempts: 10,
          correctCount: 0,
          incorrectCount: 10,
          lastStudiedAt: '2026-01-02T00:00:00.000Z',
          isMarkedWeak: true,
        },
        'item-02': {
          itemId: 'item-02',
          totalAttempts: 5,
          correctCount: 0,
          incorrectCount: 5,
          lastStudiedAt: '2026-01-02T00:00:00.000Z',
          isMarkedWeak: true,
        },
        'item-03': {
          itemId: 'item-03',
          totalAttempts: 1,
          correctCount: 0,
          incorrectCount: 1,
          lastStudiedAt: '2026-01-02T00:00:00.000Z',
          isMarkedWeak: true,
        },
      },
    };

    const html = renderHome(zeroAccuracyState);
    // Coverage is STILL 75% because coverage measures breadth of study, not accuracy or mastery
    expect(html).toContain('75%');
    expect(html).toContain('aria-valuenow="75"');
  });

  it('renders the safe IconBook placeholder path for books without coverImageId', () => {
    const html = renderToString(
      <AppStateProvider initialState={populatedState}>
        <NavigationProvider initialPath="/">
          <BookCover title="Test Book Without Cover" />
        </NavigationProvider>
      </AppStateProvider>
    );

    // Placeholder has no <img> tag
    expect(html).not.toContain('<img');
    // Has aria-hidden for decorative placeholder
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders ProgressBar with valid accessibility attributes and semantic classes', () => {
    const html = renderToString(
      <ProgressBar value={42} ariaLabel="Tiến độ học tập: 42%" />
    );

    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('aria-valuenow="42"');
    expect(html).toContain('aria-label="Tiến độ học tập: 42%"');
    expect(html).toMatch(/width:\s*42%/);
    expect(html).toContain('bg-primary');
  });

  it('renders TopBar as an opaque part of the theme canvas with rounded-full clay controls', () => {
    const html = renderHome(populatedState);

    // TopBar shares the opaque theme canvas with a hairline border, strictly NO backdrop-blur
    const header = html.match(/<header[^>]*>/);
    expect(header).not.toBeNull();
    expect(header![0]).toContain('bg-page');
    // No divider line under the TopBar
    expect(header![0]).not.toMatch(/border-b\b/);
    expect(html).not.toContain('backdrop-blur');
    expect(html).not.toMatch(/bg-(?:page|surface)\/\d+/);

    // Controls use rounded-full
    expect(html).toContain('rounded-full');
    expect(html).toContain('shadow-clay-card');
  });

  it('applies category semantic tokens and canonical clay recipe to study actions', () => {
    const html = renderHome(populatedState);

    // Category tokens
    expect(html).toContain('bg-category-vocabulary-surface');
    expect(html).toContain('border-category-vocabulary-border');
    expect(html).toContain('text-category-vocabulary-icon');
    expect(html).toContain('text-category-vocabulary-text');

    expect(html).toContain('bg-category-kanji-surface');
    expect(html).toContain('border-category-kanji-border');
    expect(html).toContain('text-category-kanji-icon');
    expect(html).toContain('text-category-kanji-text');

    // Mixed Test uses the dedicated solid primary CTA tokens
    expect(html).toContain('bg-cta-surface');
    expect(html).toContain('border-cta-border');
    expect(html).toContain('text-cta-text');
    expect(html).not.toContain('border-primary/20');
    expect(html).toContain('shadow-clay-button');

    // Canonical clay interaction is carried by the shared `.clay-interactive` rule
    expect(html).toContain('clay-interactive');
  });

  it('applies 2px focus-ring offset to page consistently on all interactive Home controls', () => {
    const html = renderHome(populatedState);

    // Primary focus ring and 2px offset classes
    expect(html).toContain('focus-visible:ring-2');
    expect(html).toContain('focus-visible:ring-primary');
    expect(html).toContain('focus-visible:ring-offset-2');
    expect(html).toContain('focus-visible:ring-offset-page');
    expect(html).toContain('focus-visible:outline-none');

    // Test with empty state to check EmptyState action button focus offset
    const emptyHtml = renderHome({
      ...populatedState,
      books: {},
    });
    expect(emptyHtml).toContain('focus-visible:ring-offset-2');
    expect(emptyHtml).toContain('focus-visible:ring-offset-page');
  });

  it('renders the empty Study Books state inline inside its section, not as a floating card', () => {
    const emptyBooksState: UserStudyState = {
      ...populatedState,
      books: {},
    };

    const html = renderHome(emptyBooksState);

    // No longer a centered, width-constrained floating card
    expect(html).not.toContain('max-w-md mx-auto w-full');

    // Empty state sits inside the Study Books section, after its heading
    const booksSectionStart = html.indexOf('aria-labelledby="home-study-books-heading"');
    const emptyTitleIndex = html.indexOf('Chưa có giáo trình nào.');
    expect(booksSectionStart).toBeGreaterThan(-1);
    expect(emptyTitleIndex).toBeGreaterThan(booksSectionStart);

    // The only action is a real button leading to Settings with a 48px touch target
    expect(html).toMatch(/<button[^>]*class="[^"]*min-h-touch[^"]*"[^>]*>(?:(?!<\/button>).)*Cài đặt<\/button>/);
  });

  it('renders Study Books first, then Vocabulary / Kanji shortcuts, then Mixed Test', () => {
    for (const html of [renderHome(populatedState), renderHome({ ...populatedState, books: {} })]) {
      const booksIndex = html.indexOf('id="home-study-books-heading"');
      const learnIndex = html.indexOf('id="home-learn-by-type-heading"');
      const vocabIndex = html.indexOf('data-category="vocabulary"');
      const kanjiIndex = html.indexOf('data-category="kanji"');
      const mixedIndex = html.indexOf('id="home-mixed-test-heading"');

      expect(booksIndex).toBeGreaterThan(-1);
      expect(learnIndex).toBeGreaterThan(booksIndex);
      expect(vocabIndex).toBeGreaterThan(learnIndex);
      expect(kanjiIndex).toBeGreaterThan(vocabIndex);
      expect(mixedIndex).toBeGreaterThan(kanjiIndex);
    }
  });

  it('renders no visible greeting and keeps section headings screen-reader only', () => {
    for (const language of ['vi', 'en'] as const) {
      const html = renderHome({
        ...populatedState,
        preferences: { ...populatedState.preferences, language },
      });

      expect(html).not.toContain('home-greeting-heading');
      expect(html).not.toContain('Chọn một lối học để bắt đầu.');
      expect(html).not.toContain('Pick a study path to begin.');

      // A single screen-reader page heading
      expect(html.match(/<h1[^>]*>/g)).toHaveLength(1);
      expect(html).toMatch(/<h1 class="sr-only">/);
    }

    const html = renderHome(populatedState);
    expect(html).toContain('<h2 id="home-study-books-heading" class="sr-only">Giáo trình</h2>');
    expect(html).toContain('<h2 id="home-learn-by-type-heading" class="sr-only">Học theo loại</h2>');

    // Every h2 on Home is visually hidden (no visible "Giáo trình" / "Học theo loại" labels)
    const h2Tags = html.match(/<h2[^>]*>/g) ?? [];
    expect(h2Tags).toHaveLength(2);
    for (const tag of h2Tags) {
      expect(tag).toContain('class="sr-only"');
    }
  });

  it('renders no theme status or theme control on Home while keeping the Settings button', () => {
    for (const theme of ['light', 'dark', 'sakura'] as const) {
      const html = renderHome({
        ...populatedState,
        preferences: { ...populatedState.preferences, theme },
      });
      expect(html).not.toContain('Giao diện hiện tại');
      expect(html).not.toContain('tabler-icon-sun');
      expect(html).not.toContain('tabler-icon-moon');
      expect(html).not.toContain('tabler-icon-flower');

      const settingsButton = html.match(/<button[^>]*aria-label="Cài đặt"[^>]*>/);
      expect(settingsButton).not.toBeNull();
      expect(settingsButton![0]).toContain('min-h-touch');
      expect(settingsButton![0]).toContain('clay-interactive');
    }
  });

  it('exposes the full book title for hover and renders it with the Japanese-safe title font', () => {
    const longTitle = '耳から覚える 日本語能力試験 文法トレーニング N3';
    const html = renderHome({
      ...populatedState,
      books: { 'book-01': { ...mockBook1, title: longTitle } },
    });

    const cardTag = html.match(/<button[^>]*aria-label="Mở giáo trình [^"]*"[^>]*>/);
    expect(cardTag).not.toBeNull();
    expect(cardTag![0]).toContain('title="' + longTitle + '"');

    const titleHeading = html.match(/<h3[^>]*>耳から覚える[^<]*<\/h3>/);
    expect(titleHeading).not.toBeNull();
    expect(titleHeading![0]).toContain('font-study-title');
    expect(titleHeading![0]).toContain('line-clamp-3');

    const css = readFileSync(resolve(__dirname, '../../../index.css'), 'utf-8');
    expect(css).toMatch(/\.font-study-title\s*\{\s*font-family:\s*"Be Vietnam Pro",\s*var\(--font-japanese\);/);
  });

  it('gives Vocabulary and Kanji tiles distinct category identities and accessible labels', () => {
    const html = renderHome(populatedState);

    // Each tile is a registered study card tagged with its category
    expect(html).toMatch(/<button[^>]*data-study-card="true"[^>]*data-category="vocabulary"/);
    expect(html).toMatch(/<button[^>]*data-study-card="true"[^>]*data-category="kanji"/);
    expect(html).toContain('aria-label="Học theo loại: Từ vựng"');
    expect(html).toContain('aria-label="Học theo loại: Hán tự"');

    // The Japanese category name is the visual identity (hidden from screen readers,
    // which read the localized aria-label), followed by the localized category name
    expect(html).toMatch(/<span lang="ja" aria-hidden="true"[^>]*>語彙<\/span><h3[^>]*>Từ vựng<\/h3>/);
    expect(html).toMatch(/<span lang="ja" aria-hidden="true"[^>]*>漢字<\/span><h3[^>]*>Hán tự<\/h3>/);

    // Each tile carries exactly one decorative category illustration (no Tabler icon pucks)
    const tileMarkup = (category: string) => {
      const start = html.indexOf(`data-category="${category}"`);
      return html.slice(start, html.indexOf('</button>', start));
    };
    const illustrationGlyph = { vocabulary: 'あ', kanji: '字' } as const;
    const illustrationColor = {
      vocabulary: 'text-category-vocabulary-icon',
      kanji: 'text-category-kanji-icon',
    } as const;
    for (const category of ['vocabulary', 'kanji'] as const) {
      const markup = tileMarkup(category);
      const svgTags = markup.match(/<svg[^>]*>/g) ?? [];
      expect(svgTags).toHaveLength(1);
      expect(svgTags[0]).toContain('aria-hidden="true"');
      expect(svgTags[0]).toContain('focusable="false"');
      // Color follows the category token through currentColor, not a hardcoded root color
      expect(svgTags[0]).toContain(illustrationColor[category]);
      expect(svgTags[0]).not.toMatch(/\scolor="/);
      expect(markup).not.toContain('tabler-icon');
      expect(markup).toMatch(new RegExp(`<text[^>]*lang="ja"[^>]*>${illustrationGlyph[category]}</text>`));
      expect(markup).not.toMatch(COUNT_PATTERN);
    }

    // Filter ids are namespaced per illustration and unique across the rendered page
    const filterIds = Array.from(html.matchAll(/<filter id="([^"]+)"/g), (m) => m[1]);
    expect(filterIds).toHaveLength(4);
    expect(new Set(filterIds).size).toBe(filterIds.length);
    expect(filterIds).not.toContain('shadow');
    expect(filterIds).not.toContain('softShadow');
    for (const id of filterIds) {
      expect(html).toContain(`filter="url(#${id})"`);
    }

    // Study action order for arrow-key navigation: books, Vocabulary, Kanji, then Mixed Test
    const cardOrder = Array.from(
      html.matchAll(/<button[^>]*data-study-card="true"[^>]*>/g),
      (match) => {
        const tag = match[0];
        if (tag.includes('data-category="vocabulary"')) return 'vocabulary';
        if (tag.includes('data-category="kanji"')) return 'kanji';
        if (tag.includes('id="home-mixed-test-heading"')) return 'mixed';
        return 'book';
      }
    );
    expect(cardOrder).toEqual(['book', 'vocabulary', 'kanji', 'mixed']);
  });

  it('renders the Test CTA as a short label with a "+" affordance and an explicit accessible name', () => {
    const html = renderHome(populatedState);
    const tag = html.match(/<button[^>]*id="home-mixed-test-heading"[^>]*>/);
    expect(tag).not.toBeNull();
    expect(tag![0]).toContain('aria-label="Tạo bài kiểm tra"');
    expect(tag![0]).toContain('data-study-card="true"');

    const start = html.indexOf('id="home-mixed-test-heading"');
    const markup = html.slice(start, html.indexOf('</button>', start));
    expect(markup).toContain('>Kiểm tra</h3>');
    expect(markup).not.toContain('Kiểm tra tổng hợp');
    expect(markup).not.toMatch(/<p[\s>]/);
    expect(markup.match(/<svg/g)).toHaveLength(1);
    expect(markup).toContain('tabler-icon-plus');
    expect(markup).not.toContain('tabler-icon-arrow-right');
  });

  describe('book preview limit and "View all"', () => {
    const makeBooks = (count: number) =>
      Object.fromEntries(
        Array.from({ length: count }, (_, i) => [
          `book-${i + 1}`,
          {
            id: `book-${i + 1}`,
            title: `Book ${i + 1}`,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ])
      );
    const bookCardCount = (html: string) => (html.match(/aria-label="Mở giáo trình /g) ?? []).length;

    it('shows only the first 2 books and a collapsed "Xem tất cả" toggle when more exist', () => {
      const html = renderHome({ ...populatedState, books: makeBooks(4) });

      expect(bookCardCount(html)).toBe(2);
      expect(html).toContain('Book 1');
      expect(html).toContain('Book 2');
      expect(html).not.toContain('Book 3');

      const toggle = html.match(/<button[^>]*aria-controls="home-more-books"[^>]*>/);
      expect(toggle).not.toBeNull();
      expect(toggle![0]).toContain('aria-expanded="false"');
      expect(toggle![0]).toContain('min-h-touch');
      expect(html).toContain('Xem tất cả');
      // The toggle is not a study card and never reorders books
      expect(toggle![0]).not.toContain('data-study-card');
      expect(html).not.toContain('draggable="true"');
    });

    it('renders no "View all" toggle when 2 or fewer books exist', () => {
      for (const count of [1, 2]) {
        const html = renderHome({ ...populatedState, books: makeBooks(count) });
        expect(bookCardCount(html)).toBe(count);
        expect(html).not.toContain('home-more-books');
        expect(html).not.toContain('Xem tất cả');
      }
    });

    it('renders "View all" as a centered, compact dashed bridge under the preview books', () => {
      const html = renderHome({ ...populatedState, books: makeBooks(3) });
      const wrapperAndToggle = html.match(/<div class="([^"]*)"><button[^>]*aria-controls="home-more-books"[^>]*>/);
      expect(wrapperAndToggle).not.toBeNull();
      expect(wrapperAndToggle![1]).toContain('justify-center');
      expect(wrapperAndToggle![0]).toContain('border-dashed');
    });

    it('localizes the toggle label', () => {
      const html = renderHome({
        ...populatedState,
        books: makeBooks(3),
        preferences: { ...populatedState.preferences, language: 'en' },
      });
      expect(html).toContain('View all');
    });
  });

  describe('category shortcut composition', () => {
    it('pins the glyph and label so Japanese and Vietnamese text never wrap', () => {
      const html = renderHome(populatedState);
      for (const [category, glyph, label] of [
        ['vocabulary', '語彙', 'Từ vựng'],
        ['kanji', '漢字', 'Hán tự'],
      ] as const) {
        const start = html.indexOf(`data-category="${category}"`);
        const markup = html.slice(start, html.indexOf('</button>', start));
        const glyphTag = markup.match(new RegExp(`<span lang="ja" aria-hidden="true"[^>]*>${glyph}</span>`));
        expect(glyphTag).not.toBeNull();
        expect(glyphTag![0]).toContain('whitespace-nowrap');
        const labelTag = markup.match(new RegExp(`<h3[^>]*>${label}</h3>`));
        expect(labelTag).not.toBeNull();
        expect(labelTag![0]).toContain('whitespace-nowrap');
        // Illustration is pinned to the top-right corner
        const svgTag = markup.match(/<svg[^>]*>/);
        expect(svgTag![0]).toMatch(/class="[^"]*absolute[^"]*top-[^"]*right-/);
      }
    });
  });

  describe('theme ambience layer', () => {
    it('renders one decorative, non-interactive layer with a scene per theme', () => {
      const html = renderHome(populatedState);
      const layer = html.match(/<div[^>]*class="tango-ambience"[^>]*>/);
      expect(layer).not.toBeNull();
      expect(layer![0]).toContain('aria-hidden="true"');
      for (const scene of ['ambience-light', 'ambience-dark', 'ambience-sakura']) {
        expect(html).toContain(`ambience-scene ${scene}`);
      }
      // A few intentional Japanese motifs per theme
      expect(html).toContain('ambience-shoji-window');
      expect(html).toContain('ambience-seigaiha');
      expect(html).toContain('ambience-lantern');
      expect(html).toContain('ambience-night-window');
      expect(html).toContain('ambience-branch');
      expect(html).toContain('ambience-kasumi');
      // Ambience sits before (behind) the TopBar and main content
      expect(html.indexOf('tango-ambience')).toBeLessThan(html.indexOf('<header'));
      expect(html.indexOf('tango-ambience')).toBeLessThan(html.indexOf('<main'));
    });

    it('keeps ambience fixed, non-interactive, theme-scoped, and static under reduced motion', () => {
      const css = readFileSync(resolve(__dirname, '../../../index.css'), 'utf-8');
      expect(css).toMatch(/\.tango-ambience\s*\{[^}]*position:\s*fixed;[^}]*pointer-events:\s*none;/);
      expect(css).toContain('[data-theme="dark"] .ambience-dark');
      expect(css).toContain('[data-theme="sakura"] .ambience-sakura');
      expect(css).toMatch(
        /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.ambience-animated\s*\{\s*animation:\s*none !important;/
      );
      // Petals keep a fixed tilt; they are never flipped or spun
      const fall = css.match(/@keyframes ambience-fall\s*\{[\s\S]*?\n\}/);
      expect(fall).not.toBeNull();
      const angles = Array.from(fall![0].matchAll(/rotate\((-?\d+)deg\)/g), (m) => Number(m[1]));
      expect(new Set(angles).size).toBe(1);
      expect(Math.abs(angles[0])).toBeLessThan(45);
    });
  });

  it('renders book cards with title and coverage but no lesson/item counts', () => {
    const html = renderHome(populatedState);
    const start = html.indexOf('aria-label="Mở giáo trình Chūkyū e Ikō"');
    const markup = html.slice(start, html.indexOf('</button>', start));

    expect(markup).toContain('Chūkyū e Ikō');
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('75%');
    expect(markup).not.toMatch(COUNT_PATTERN);
  });

  it('renders a single Study Coverage progress bar per book card', () => {
    const html = renderHome(populatedState);
    expect(html.match(/role="progressbar"/g)).toHaveLength(1);
  });

  describe('clay press interaction contract (structural; does not reproduce real touch devices)', () => {
    const interactiveButtonTags = (html: string) =>
      Array.from(html.matchAll(/<button[^>]*class="[^"]*clay-interactive[^"]*"[^>]*>/g), (m) => m[0]);

    it('never relies on CSS :hover or :active utilities for clay elevation on Home controls', () => {
      for (const html of [renderHome(populatedState), renderHome({ ...populatedState, books: {} })]) {
        expect(html).not.toContain('active:translate-y-px');
        expect(html).not.toContain('active:shadow-clay-pressed');
        expect(html).not.toContain('hover:-translate-y-px');
        expect(html).not.toContain('hover:shadow-clay-card-hover');
        expect(html).not.toContain('group-hover:');
      }
    });

    it('marks every tactile Home control with clay-interactive and an explicit resting press state', () => {
      const html = renderHome(populatedState);
      const tags = interactiveButtonTags(html);

      // Settings, Vocabulary, Kanji, Mixed Test, and the single book card
      expect(tags).toHaveLength(5);
      for (const tag of tags) {
        expect(tag).toContain('data-pressed="false"');
        expect(tag).not.toContain(CLAY_PRESSED_CLASSES);
      }

      // Every registered study card is a clay-interactive control
      const studyCards = Array.from(
        html.matchAll(/<button[^>]*data-study-card="true"[^>]*>/g),
        (m) => m[0]
      );
      expect(studyCards).toHaveLength(4);
      for (const tag of studyCards) {
        expect(tag).toContain('clay-interactive');
      }

      // Empty-state Settings action uses the same contract
      const emptyTags = interactiveButtonTags(renderHome({ ...populatedState, books: {} }));
      expect(emptyTags).toHaveLength(5); // Settings, Vocabulary, Kanji, Mixed Test, empty-state action
      for (const tag of emptyTags) {
        expect(tag).toContain('data-pressed="false"');
      }
    });

    it('gates hover elevation behind a real hovering pointer and drives pressed depth from state', () => {
      const css = readFileSync(resolve(__dirname, '../../../index.css'), 'utf-8');

      expect(css).toContain('@media (hover: hover) and (pointer: fine)');
      expect(css).toMatch(/\.clay-interactive:hover:not\(\[data-pressed="true"\]\)/);
      expect(css).not.toMatch(/\.clay-interactive[^{]*:active/);
      expect(CLAY_PRESSED_CLASSES).toBe('translate-y-px shadow-clay-pressed');
    });

    it('only starts a press for primary mouse button, touch, or pen contacts', () => {
      expect(shouldStartPress('mouse', 0)).toBe(true);
      expect(shouldStartPress('mouse', 2)).toBe(false);
      expect(shouldStartPress('touch', 0)).toBe(true);
      expect(shouldStartPress('pen', 0)).toBe(true);
    });

    it('detects a pointer dragged outside the control bounds', () => {
      const rect = { left: 10, right: 110, top: 20, bottom: 70 };
      expect(isPointInsideRect(50, 40, rect)).toBe(true);
      expect(isPointInsideRect(10, 20, rect)).toBe(true);
      expect(isPointInsideRect(111, 40, rect)).toBe(false);
      expect(isPointInsideRect(50, 71, rect)).toBe(false);
    });
  });
});
