import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { AppStateProvider } from '../../../hooks/useAppState';
import { NavigationProvider } from '../../../hooks/useNavigation';
import { HomeStudyHub } from '../HomeStudyHub';
import { BookCover } from '../BookCover';
import { ProgressBar } from '../../../components/ProgressBar';
import { UserStudyState, StudyBook, Lesson } from '../../../types';

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

  it('renders Vietnamese Home with correct titles, greeting, and metrics', () => {
    const html = renderHome(populatedState);

    // 1. Vietnamese Greeting
    expect(html).toContain('Bạn muốn học gì hôm nay?');

    // 2. TopBar wordmark and theme
    expect(html).toContain('TANGO');
    expect(html).toContain('min-h-touch');
    expect(html).toContain('Giao diện hiện tại: Sáng');

    // 3. Book titles and section
    expect(html).toContain('Giáo trình');
    expect(html).toContain('Chūkyū e Ikō');

    // 4. Book metrics: 2 lessons, 4 items
    expect(html).toContain('2 bài');
    expect(html).toContain('4 mục');

    // 5. Book Study Coverage is strictly 75% (3 studied out of 4 items)
    expect(html).toContain('75%');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="75"');

    // 6. Global Learn by Type counts:
    // Vocabulary: mockLesson1 (2 items) + mockUnassignedLesson (3 items) = 2 lessons, 5 items
    expect(html).toContain('Học theo loại');
    expect(html).toContain('Từ vựng');
    expect(html).toContain('2 bài');
    expect(html).toContain('5 mục');

    // Kanji: mockLesson2 (2 items) = 1 lesson, 2 items
    expect(html).toContain('Hán tự');
    expect(html).toContain('1 bài');
    expect(html).toContain('2 mục');

    // 7. Mixed Test Action
    expect(html).toContain('Kiểm tra tổng hợp');
    expect(html).toContain('Tùy chọn nhiều bài học trên tất cả giáo trình để kiểm tra');
  });

  it('preserves an interactive TANGO wordmark button with 48px minimum touch-target class', () => {
    const html = renderHome(populatedState);

    expect(html).toContain('TANGO');
    expect(html).toContain('min-h-touch');
    expect(html).toMatch(/<button[^>]*class="[^"]*min-h-touch[^"]*"[^>]*>[^<]*TANGO[^<]*<\/button>/);
  });

  it('renders English Home with correct singular and plural count labels', () => {
    const enState: UserStudyState = {
      ...populatedState,
      preferences: {
        ...populatedState.preferences,
        language: 'en',
        theme: 'dark',
      },
    };

    const html = renderHome(enState);

    // 1. English Greeting
    expect(html).toContain('What would you like to learn today?');

    // 2. English TopBar Theme
    expect(html).toContain('Current theme: Dark');

    // 3. English section headers
    expect(html).toContain('Study Books');
    expect(html).toContain('Learn by Type');
    expect(html).toContain('Mixed Test');
    expect(html).toContain('Select multiple lessons across all study books to test');

    // 4. English Category titles
    expect(html).toContain('Vocabulary');
    expect(html).toContain('Kanji');

    // 5. English plural counters
    expect(html).toContain('2 lessons');
    expect(html).toContain('4 items');
    expect(html).toContain('5 items');

    // 6. English singular counter on Kanji card (mockLesson2 is 1 lesson)
    expect(html).toContain('1 lesson');
    expect(html).not.toContain('1 lessons');
  });

  it('renders English singular item count correctly for a single-item lesson', () => {
    const singleItemState: UserStudyState = {
      ...populatedState,
      preferences: {
        ...populatedState.preferences,
        language: 'en',
      },
      books: {
        'book-single': {
          id: 'book-single',
          title: 'Single Item Book',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      lessons: {
        'lesson-single': {
          id: 'lesson-single',
          bookId: 'book-single',
          category: 'kanji',
          title: 'Single Kanji Lesson',
          items: [{ id: 'item-single', japanese: '日', vietnamese: ['ngày'] }],
        },
      },
      progressByItem: {},
    };

    const html = renderHome(singleItemState);

    // 1 lesson and 1 item in English
    expect(html).toContain('1 lesson');
    expect(html).not.toContain('1 lessons');
    expect(html).toContain('1 item');
    expect(html).not.toContain('1 items');
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

    // 4. Learn by Type remains rendered and unassigned lessons are counted
    expect(html).toContain('Học theo loại');
    expect(html).toContain('Từ vựng');
    // Only mockUnassignedLesson exists for vocabulary (1 lesson, 3 items)
    expect(html).toContain('1 bài');
    expect(html).toContain('3 mục');

    // Mixed test remains available
    expect(html).toContain('Kiểm tra tổng hợp');
  });

  it('verifies unassigned category content contributes to global counts but not to any book', () => {
    // Unassigned lesson has no bookId, so book-01 only has mockLesson1 (1 vocab, 2 items)
    // Global vocabulary has mockLesson1 (2 items) + mockUnassignedLesson (3 items) = 5 items
    const html = renderHome(populatedState);

    // Book-01 metrics should only show its own 2 lessons and 4 items
    expect(html).toContain('Chūkyū e Ikō');
    expect(html).toContain('2 bài');
    expect(html).toContain('4 mục');

    // Global vocabulary includes the unassigned lesson (2 lessons, 5 items)
    expect(html).toContain('5 mục');
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
});
