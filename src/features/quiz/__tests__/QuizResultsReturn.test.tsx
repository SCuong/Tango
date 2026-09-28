import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppStateProvider } from '../../../hooks/useAppState';
import { AppLanguage, Lesson, UserStudyState } from '../../../types';
import { QuizSessionConfig } from '../../../lib/quizSession';
import { CompletedQuiz, QuizSessionProvider } from '../QuizSessionContext';
import { QuizResultsScreen, resultsKeyAction } from '../QuizResultsScreen';

// The Results actions are observed through the navigation and quiz-start hooks they call
const spies = vi.hoisted(() => ({ returnTo: vi.fn(), navigate: vi.fn(), startQuiz: vi.fn(() => true) }));
vi.mock('../../../hooks/useNavigation', () => ({
  useNavigation: () => ({ returnTo: spies.returnTo, navigate: spies.navigate }),
}));
vi.mock('../useStartQuiz', () => ({ useStartQuiz: () => spies.startQuiz }));

const lesson: Lesson = {
  id: 'l1',
  bookId: 'b1',
  category: 'kanji',
  title: 'Bài 1',
  items: [
    { id: 'i1', japanese: '旅行', kana: 'りょこう', vietnamese: ['du lịch'] },
    { id: 'i2', japanese: '実際', kana: 'じっさい', vietnamese: ['thực tế'] },
    { id: 'i3', japanese: '礼儀', kana: 'れいぎ', vietnamese: ['lễ nghi'] },
    { id: 'i4', japanese: '景観', kana: 'けいかん', vietnamese: ['cảnh quan'] },
  ],
};

const KANJI = { type: 'category_inside_book', bookId: 'b1', category: 'kanji' } as const;

function completed(config: Partial<QuizSessionConfig>): CompletedQuiz {
  return {
    config: { lessonIds: ['l1'], mode: 'test', questionCount: 'all', allowedTypes: ['japanese_to_vi'], kind: 'standard', ...config },
    result: {
      sessionId: 's1',
      lessonIds: ['l1'],
      mode: 'test',
      totalQuestions: 4,
      correctCount: 3,
      incorrectCount: 1,
      accuracy: 75,
      bestStreak: 2,
      timeSpentSeconds: 30,
      missedItemIds: ['i2'],
      completedAt: '2026-09-28T00:00:00.000Z',
    },
  };
}

function state(language: AppLanguage): UserStudyState {
  return {
    version: 1,
    preferences: { theme: 'light', language, soundEnabled: false, answerLayout: 'grid' },
    books: {},
    lessons: { l1: lesson },
    progressByItem: {},
    recentResults: [],
  };
}

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  'data-return-target'?: string;
}

/** Renders Results and returns the HTML plus the props of its action buttons (no DOM here). */
function renderResults(quiz: CompletedQuiz | null, language: AppLanguage = 'vi') {
  let tree: unknown = null;
  const Capture = () => {
    tree = QuizResultsScreen({});
    return tree as React.ReactElement;
  };
  const html = renderToString(
    <AppStateProvider initialState={state(language)}>
      <QuizSessionProvider initialCompleted={quiz}>
        <Capture />
      </QuizSessionProvider>
    </AppStateProvider>
  );
  const buttons: ButtonProps[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object' || !('props' in node)) return;
    const props = (node as React.ReactElement).props as Record<string, unknown>;
    if (typeof props.onClick === 'function' && props.size === 'lg') buttons.push(props as unknown as ButtonProps);
    walk(props.children);
    walk(props.header);
  };
  walk(tree);
  return { html, buttons };
}

beforeEach(() => {
  spies.returnTo.mockClear();
  spies.navigate.mockClear();
  spies.startQuiz.mockClear();
});

describe('Quiz Results contextual return', () => {
  it('replaces the Home action with the quiz origin, as the quiet last action', () => {
    const { html, buttons } = renderResults(completed({ returnTarget: KANJI }));
    expect(html).toContain('Về Hán tự');
    expect(html).not.toContain('Về trang chủ');
    // Review Missed, Retry, then the contextual return
    expect(buttons.map((button) => button['data-return-target'] ?? 'action')).toEqual(['action', 'action', 'category_inside_book']);
    buttons[2].onClick();
    expect(spies.returnTo).toHaveBeenCalledWith(KANJI);
    expect(spies.navigate).not.toHaveBeenCalled();
  });

  it('labels each origin in Vietnamese and English', () => {
    const cases = [
      [{ type: 'category_inside_book', bookId: 'b1', category: 'vocabulary' }, 'Về Từ vựng', 'Back to Vocabulary'],
      [{ type: 'book_study', bookId: 'b1' }, 'Về giáo trình', 'Back to book'],
      [{ type: 'lesson_detail', lessonId: 'l1' }, 'Về bài học', 'Back to lesson'],
      [{ type: 'mixed_quiz_config' }, 'Về Kiểm tra', 'Back to Test'],
    ] as const;
    for (const [returnTarget, vi_, en] of cases) {
      expect(renderResults(completed({ returnTarget }), 'vi').html).toContain(vi_);
      expect(renderResults(completed({ returnTarget }), 'en').html).toContain(en);
    }
  });

  it('Retry keeps the original return target', () => {
    const quiz = completed({ returnTarget: KANJI });
    const { buttons } = renderResults(quiz);
    buttons[1].onClick();
    expect(spies.startQuiz).toHaveBeenCalledWith(quiz.config);
    expect((spies.startQuiz.mock.calls[0] as unknown[])[0]).toMatchObject({ returnTarget: KANJI, kind: 'standard' });
  });

  it('Review Missed keeps the ORIGINAL return target (not the Results screen)', () => {
    const { buttons } = renderResults(completed({ returnTarget: KANJI }));
    buttons[0].onClick();
    const review = (spies.startQuiz.mock.calls[0] as unknown[])[0] as QuizSessionConfig;
    expect(review).toMatchObject({ kind: 'review', focusItemIds: ['i2'], returnTarget: KANJI });

    // Results of that review still return to the Kanji category, and so does its own review
    const second = renderResults(completed({ ...review }));
    expect(second.html).toContain('Về Hán tự');
    second.buttons[0].onClick();
    expect(((spies.startQuiz.mock.calls[1] as unknown[])[0] as QuizSessionConfig).returnTarget).toEqual(KANJI);
  });

  it('falls back to Home for a session without return metadata', () => {
    const { html, buttons } = renderResults(completed({}));
    expect(html).toContain('Về trang chủ');
    buttons[buttons.length - 1].onClick();
    expect(spies.returnTo).toHaveBeenCalledWith({ type: 'home' });
    expect(renderResults(completed({}), 'en').html).toContain('Back to Home');
  });

  it('Escape takes the contextual return; Enter on the page still starts the review', () => {
    expect(resultsKeyAction('Escape', true)).toBe('return');
    expect(resultsKeyAction('Escape', false)).toBe('return');
    expect(resultsKeyAction('Enter', true)).toBe('review');
    expect(resultsKeyAction('Enter', false)).toBeNull();
    expect(resultsKeyAction('a', true)).toBeNull();
  });
});
