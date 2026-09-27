import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { App, rootWrapperClassName } from '../App';
import { AppStateProvider } from '../hooks/useAppState';
import { NavigationProvider } from '../hooks/useNavigation';
import { CompletedQuiz, QuizSessionProvider } from '../features/quiz/QuizSessionContext';
import { Lesson, StudyBook, UserStudyState, AppLanguage } from '../types';
import { generateQuizQuestions } from '../lib/quizEngine';
import { answerCurrentQuestion, createQuizSession, DEFAULT_QUESTION_TYPES, QuizSessionState } from '../lib/quizSession';
import { parseRoute } from '../lib/routes';

const book: StudyBook = {
  id: 'book_1',
  title: '中級へ行こう 日本語の文型と表現55 第2版',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const vocab: Lesson = {
  id: 'lesson_v1',
  bookId: 'book_1',
  category: 'vocabulary',
  title: 'Bài 1',
  subtitle: 'Hành động & Đi lại',
  items: [
    { id: 'v1', japanese: '旅行', kana: 'りょこう', hanViet: 'LỮ HÀNH', vietnamese: ['du lịch', 'chuyến đi'] },
    { id: 'v2', japanese: '実際', kana: 'じっさい', hanViet: 'THỰC TẾ', vietnamese: ['thực tế'] },
    { id: 'v3', japanese: '礼儀', kana: 'れいぎ', vietnamese: ['lễ nghi'] },
    { id: 'v4', japanese: 'ファストフード', kana: 'ふぁすとふーど', vietnamese: ['đồ ăn nhanh'] },
  ],
};

const unassigned: Lesson = {
  id: 'lesson_u1',
  category: 'kanji',
  title: '20 từ Kanji JLPT N3',
  items: [{ id: 'u1', japanese: '景観', kana: 'けいかん', vietnamese: ['cảnh quan'] }],
};

function makeState(language: AppLanguage = 'vi'): UserStudyState {
  return {
    version: 1,
    preferences: { theme: 'light', language, soundEnabled: false },
    books: { [book.id]: book },
    lessons: { [vocab.id]: vocab, [unassigned.id]: unassigned },
    progressByItem: {
      v1: { itemId: 'v1', totalAttempts: 2, correctCount: 1, incorrectCount: 1, lastStudiedAt: 'x', isMarkedWeak: true },
    },
    recentResults: [],
  };
}

function render(
  path: string,
  options: { language?: AppLanguage; session?: QuizSessionState; completed?: CompletedQuiz } = {}
): string {
  return renderToString(
    <AppStateProvider initialState={makeState(options.language)}>
      <NavigationProvider initialPath={path}>
        <QuizSessionProvider initialSession={options.session ?? null} initialCompleted={options.completed ?? null}>
          <App />
        </QuizSessionProvider>
      </NavigationProvider>
    </AppStateProvider>
  );
}

const CANONICAL_PATHS = [
  '/',
  '/book/book_1',
  '/book/book_1/category/vocabulary',
  '/learn/kanji',
  '/lesson/lesson_v1',
  '/lesson/lesson_v1/items',
  '/book/book_1/category/vocabulary/quiz-config',
  '/book/book_1/quiz-config',
  '/quiz/mixed-config',
  '/quiz/session',
  '/quiz/results',
  '/quiz/review',
  '/settings',
  '/settings/content-management',
  '/settings/content-management/add-book',
  '/settings/content-management/book/book_1',
  '/settings/content-management/lesson/lesson_v1',
  '/settings/content-management/import',
];

describe('canonical routes render real screens (SSR)', () => {
  it.each(CANONICAL_PATHS)('%s renders without a development placeholder', (path) => {
    expect(parseRoute(path).type).not.toBe('not_found');
    for (const language of ['vi', 'en'] as const) {
      const html = render(path, { language });
      expect(html.length).toBeGreaterThan(200);
      expect(html).not.toContain('Tính năng đang được phát triển');
      expect(html).not.toContain('Feature in development');
    }
  });

  it('shows a calm not-found screen for deleted content', () => {
    expect(render('/book/missing')).toContain('Không tìm thấy giáo trình này');
    expect(render('/lesson/missing', { language: 'en' })).toContain('This lesson could not be found');
  });
});

describe('study screens', () => {
  it('Book Study View shows inventory, coverage, and category entries without destructive controls', () => {
    const html = render('/book/book_1');
    expect(html).toContain(book.title);
    expect(html).toContain('1 bài · 4 mục');
    expect(html).toContain('Đã học 25%');
    expect(html).toContain('Chưa có bài học nào'); // empty Kanji category
    expect(html).toContain('Kiểm tra giáo trình');
    expect(html).not.toMatch(/Xóa|Delete|Sửa/);
  });

  it('lesson rows show item count and Answer Accuracy (-- when unattempted)', () => {
    const html = render('/book/book_1/category/vocabulary');
    expect(html).toContain('4 mục');
    expect(html).toContain('50%'); // 1 correct / 2 attempts
    expect(render('/learn/kanji')).toContain('--');
  });

  it('Learn by Type groups unassigned lessons last under the neutral label', () => {
    const html = render('/learn/kanji');
    expect(html).toContain('Không thuộc giáo trình');
    expect(html).toContain('20 từ Kanji JLPT N3');
  });

  it('Lesson Detail offers actions first with dynamic counts and the weak count', () => {
    const html = render('/lesson/lesson_v1');
    expect(html).toContain('Luyện tập');
    expect(html).toContain('Tất cả (4)');
    expect(html).not.toContain('>10<'); // 10 > N is never rendered
    expect(html).toContain('1 từ cần ôn');
  });

  it('Lesson Items hides the Hán Việt tag when absent (no placeholder)', () => {
    const html = render('/lesson/lesson_v1/items');
    expect(html).toContain('LỮ HÀNH');
    expect(html).toContain('du lịch, chuyến đi');
    expect(html).not.toMatch(/N\/A|Không có/);
    expect((html.match(/Hán Việt(<!-- -->)?: <\/span>/g) ?? []).length).toBe(4); // 2 items × (mobile + desktop tag)
  });
});

describe('quiz configuration', () => {
  it('renders tally, dynamic counts, and question types for a book test', () => {
    const html = render('/book/book_1/quiz-config');
    expect(html).toContain('4 mục đã chọn · 4 câu khả dụng');
    expect(html).toContain('Tất cả (4)');
    expect(html).toContain('Kana → Chữ Hán/Từ');
  });

  it('mixed test starts empty with the N = 0 state and no "Tất cả (0)"', () => {
    const html = render('/quiz/mixed-config');
    expect(html).toContain('Không có câu hỏi phù hợp với các loại câu hỏi đã chọn.');
    expect(html).not.toContain('Tất cả (0)');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>(?:(?!<\/button>).)*Bắt đầu kiểm tra/);
  });
});

describe('quiz runtime', () => {
  const config = {
    lessonIds: ['lesson_v1'],
    mode: 'test' as const,
    questionCount: 'all' as const,
    allowedTypes: DEFAULT_QUESTION_TYPES,
    kind: 'standard' as const,
  };
  const questions = generateQuizQuestions(config, { lesson_v1: vocab }, () => 0.4);

  it('shows the prompt and exactly four answers with no A/B/C/D or 1/2/3/4 labels', () => {
    const session = createQuizSession(config, questions, Date.now());
    const html = render('/quiz/session', { session });
    const buttons = html.match(/<button[^>]*aria-label="Lựa chọn: [^"]+"[^>]*>[\s\S]*?<\/button>/g) ?? [];
    expect(buttons).toHaveLength(4);
    const options = session.queue[0].options!;
    buttons.forEach((button, index) => {
      // Visible text is exactly the answer content: no letter, number, or key-hint badges
      const text = button.replace(/<[^>]+>/g, '').trim();
      expect(text).toBe(options[index]);
    });
    expect(html).toMatch(/1<!-- --> \/ <!-- -->4/);
  });

  it('highlights the chosen wrong answer and the correct answer during feedback', () => {
    let session = createQuizSession(config, questions, Date.now());
    const q = session.queue[0];
    session = answerCurrentQuestion(session, q.options!.find((o) => o !== q.correctAnswer)!);
    const html = render('/quiz/session', { session });
    expect(html).toContain('ring-error');
    expect(html).toContain('ring-success');
  });

  it('review route without a session shows the calm empty state', () => {
    expect(render('/quiz/review')).toContain('Tuyệt vời! Bạn không có từ nào cần ôn lại.');
  });

  it('results show score, accuracy, streak, time, missed words, and the review action', () => {
    const completed: CompletedQuiz = {
      config,
      result: {
        sessionId: 's',
        lessonIds: ['lesson_v1'],
        mode: 'test',
        totalQuestions: 4,
        correctCount: 3,
        incorrectCount: 1,
        accuracy: 75,
        bestStreak: 3,
        timeSpentSeconds: 100,
        missedItemIds: ['v2'],
        completedAt: 'x',
      },
    };
    const html = render('/quiz/results', { completed });
    expect(html).toContain('3 / 4');
    expect(html).toContain('75%');
    expect(html).toContain('3 liên tiếp');
    expect(html).toContain('01:40');
    expect(html).toContain('実際');
    expect(html).toContain('Ôn lại các từ đã sai (1 từ)');
  });
});

describe('mobile primary navigation mounting', () => {
  const ROOTS: Record<string, string> = { '/': 'home', '/quiz/mixed-config': 'test', '/settings': 'settings' };

  it('mounts the bottom nav only on Home, Test, and Settings with the right active tab', () => {
    for (const path of CANONICAL_PATHS) {
      const html = render(path);
      const navCount = (html.match(/class="tango-bottom-nav sm:hidden"/g) ?? []).length;
      if (ROOTS[path]) {
        expect(navCount, path).toBe(1);
        const active = html.match(/<button[^>]*aria-current="page"[^>]*data-nav-destination="(\w+)"/g) ?? [];
        expect(active.some((tag) => tag.includes(`data-nav-destination="${ROOTS[path]}"`)), path).toBe(true);
      } else {
        expect(navCount, path).toBe(0);
        expect(html, path).not.toContain('tango-primary-root');
      }
      // A first render (initial load, reload, deep link) never plays the root entrance
      expect(html, path).not.toContain('tango-root-enter');
    }
  });

  it('scopes the root entrance class to root destinations only', () => {
    expect(rootWrapperClassName('home', false)).toBe('tango-primary-root');
    expect(rootWrapperClassName('test', true)).toBe('tango-primary-root tango-root-enter');
    expect(rootWrapperClassName('settings', true)).toBe('tango-primary-root tango-root-enter');
    // Deeper routes never carry the wrapper class, entering or not
    expect(rootWrapperClassName(null, false)).toBeUndefined();
    expect(rootWrapperClassName(null, true)).toBeUndefined();
  });

  it('never renders global navigation during an active quiz or on results', () => {
    const config = {
      lessonIds: ['lesson_v1'],
      mode: 'test' as const,
      questionCount: 'all' as const,
      allowedTypes: DEFAULT_QUESTION_TYPES,
      kind: 'standard' as const,
    };
    const session = createQuizSession(config, generateQuizQuestions(config, { lesson_v1: vocab }), Date.now());
    expect(render('/quiz/session', { session })).not.toContain('tango-bottom-nav');
    const completed: CompletedQuiz = {
      config,
      result: {
        sessionId: 's',
        lessonIds: ['lesson_v1'],
        mode: 'test',
        totalQuestions: 1,
        correctCount: 1,
        incorrectCount: 0,
        accuracy: 100,
        bestStreak: 1,
        timeSpentSeconds: 1,
        missedItemIds: [],
        completedAt: 'x',
      },
    };
    expect(render('/quiz/results', { completed })).not.toContain('tango-bottom-nav');
  });

  it('treats Test and Settings as root screens on mobile (no mobile back arrow)', () => {
    // Mixed Test: the back arrow only appears from sm up
    expect(render('/quiz/mixed-config')).toMatch(/<span class="hidden sm:block"><button[^>]*aria-label="Quay lại"/);
    // Settings: no mobile back arrow; the sm+ panel keeps its close button
    const settings = render('/settings');
    expect(settings).not.toContain('aria-label="Quay lại"');
    expect(settings).toContain('aria-label="Đóng"');
    // Deeper configuration screens keep a normal back arrow
    expect(render('/book/book_1/quiz-config')).toMatch(/<span class="contents"><button[^>]*aria-label="Quay lại"/);
  });

  it('keeps the Test root functional: mixed configuration still renders its controls', () => {
    const html = render('/quiz/mixed-config');
    expect(html).toContain('Chọn bài kiểm tra');
    expect(html).toContain('Loại câu hỏi');
    expect(html).toContain('Bắt đầu kiểm tra');
  });
});

describe('settings and content management', () => {
  it('Settings shows three real theme previews as a radio group, language, sound, and content link', () => {
    const html = render('/settings');
    expect(html).toContain('role="radiogroup"');
    expect(html.match(/data-theme="(light|dark|sakura)"/g)).toEqual([
      'data-theme="light"',
      'data-theme="dark"',
      'data-theme="sakura"',
    ]);
    expect(html).toMatch(/role="radio" aria-checked="true"[^>]*>/);
    expect(html).toContain('Tiếng Việt');
    expect(html).toContain('Quản lý giáo trình và bài học');
  });

  it('Home never shows theme controls or management actions', () => {
    const html = render('/');
    expect(html).not.toContain('data-theme=');
    expect(html).not.toMatch(/Thêm giáo trình|Nhập bài|Xóa/);
  });

  it('Content Management lists books and the unassigned section with Manage actions only', () => {
    const html = render('/settings/content-management');
    expect(html).toContain('Thêm giáo trình');
    expect(html).toContain('Không thuộc giáo trình');
    expect(html).toContain('Quản lý 20 từ Kanji JLPT N3');
    expect(html).not.toMatch(/Xóa/);
  });

  it('Manage Study Book keeps deletion inside the Danger Zone (no inline lesson delete)', () => {
    const html = render('/settings/content-management/book/book_1');
    expect(html).toContain('Vùng nguy hiểm');
    expect((html.match(/Xóa giáo trình này/g) ?? []).length).toBe(1);
    expect(html).toContain('Thêm bài vào giáo trình này');
  });

  it('Manage Lesson offers category, parent book (with Unassigned), explicit save, and its Danger Zone', () => {
    const html = render('/settings/content-management/lesson/lesson_v1', { language: 'en' });
    expect(html).toContain('Parent study book');
    expect(html).toContain('Unassigned');
    expect(html).toContain('Save changes');
    expect(html).toContain('Delete this lesson');
  });

  it('Import starts at step 1 with the documented delimiters and templates', () => {
    const html = render('/settings/content-management/import');
    expect(html).toContain('Bước 1/4');
    expect(html).toContain('Tự động (khuyên dùng)');
    expect(html).toContain('Ký hiệu khác...');
    expect(html).toContain('Markdown');
    expect(html).toContain('Excel');
  });
});
