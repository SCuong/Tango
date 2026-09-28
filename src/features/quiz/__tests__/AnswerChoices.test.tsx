import { readFileSync } from 'fs';
import { resolve } from 'path';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { App } from '../../../App';
import { AppStateProvider } from '../../../hooks/useAppState';
import { NavigationProvider } from '../../../hooks/useNavigation';
import { QuizSessionProvider } from '../QuizSessionContext';
import { AnswerLayout, QuestionType, QuizQuestion, UserStudyState } from '../../../types';
import { QuizSessionState, answerCurrentQuestion, createQuizSession } from '../../../lib/quizSession';

const target = { id: 'i1', japanese: '猫', kana: 'ねこ', vietnamese: ['con mèo'] };

function question(type: QuestionType, options: string[] | undefined, correctAnswer: string): QuizQuestion {
  return { id: 'q-1', type, prompt: type === 'japanese_to_vi' ? '猫' : 'con mèo', correctAnswer, options, targetItem: target };
}

const SHORT_VI = question('japanese_to_vi', ['con mèo', 'du lịch', 'thực tế', 'lễ nghi'], 'con mèo');
const LONG_VI = question('japanese_to_vi', ['con mèo', 'sách hướng dẫn sử dụng sản phẩm chi tiết', 'thực tế', 'lễ nghi'], 'con mèo');
const SHORT_JA = question('vi_to_japanese', ['猫', '駅', '会社', '学校'], '猫');
const LONG_JA = question('vi_to_japanese', ['猫', 'ネットショッピングサイト', '会社', '学校'], '猫');
const WRITTEN = question('vi_to_text', undefined, '猫');

function session(q: QuizQuestion): QuizSessionState {
  return createQuizSession(
    { lessonIds: ['l1'], mode: 'practice', questionCount: 'all', allowedTypes: [q.type], kind: 'standard' },
    [q],
    Date.now()
  );
}

function renderQuiz(answerLayout: AnswerLayout, quiz: QuizSessionState): string {
  const state: UserStudyState = {
    version: 1,
    preferences: { theme: 'light', language: 'vi', soundEnabled: false, answerLayout },
    books: {},
    lessons: {},
    progressByItem: {},
    recentResults: [],
  };
  return renderToString(
    <AppStateProvider initialState={state}>
      <NavigationProvider initialPath="/quiz/session">
        <QuizSessionProvider initialSession={quiz}>
          <App />
        </QuizSessionProvider>
      </NavigationProvider>
    </AppStateProvider>
  );
}

function layoutOf(html: string): { layout: string; listClass: string } {
  const match = html.match(/data-answer-layout="(\w+)">(?:[\s\S]*?<\/div><\/div>)??<div class="([^"]*)">/)!;
  return { layout: match[1], listClass: match[2] };
}

function answerButtons(html: string): string[] {
  return html.match(/<button[^>]*aria-label="Lựa chọn: [^"]+"[^>]*>[\s\S]*?<\/button>/g) ?? [];
}

describe('quiz answer layout', () => {
  it('Stacked preference: one column, no grid measurement', () => {
    const html = renderQuiz('stacked', session(SHORT_VI));
    expect(layoutOf(html)).toEqual({ layout: 'stacked', listClass: 'grid gap-3' });
    expect(html).not.toContain('data-answer-probe');
    for (const button of answerButtons(html)) expect(button).toContain('px-12');
  });

  it('Grid preference with short answers: 2×2 cards of equal height', () => {
    for (const q of [SHORT_VI, SHORT_JA]) {
      const html = renderQuiz('grid', session(q));
      expect(layoutOf(html), q.type).toEqual({ layout: 'grid', listClass: 'grid grid-cols-2 auto-rows-fr gap-3' });
      const buttons = answerButtons(html);
      expect(buttons).toHaveLength(4);
      for (const button of buttons) {
        expect(button).toContain('min-h-answer');
        expect(button).toContain('px-6 flex items-center justify-center');
      }
    }
  });

  it('Grid preference with one long answer: the entire question is stacked', () => {
    for (const q of [LONG_VI, LONG_JA]) {
      const html = renderQuiz('grid', session(q));
      expect(layoutOf(html), q.type).toEqual({ layout: 'stacked', listClass: 'grid gap-3' });
      // Every card keeps the stacked styling: no single taller grid card
      for (const button of answerButtons(html)) expect(button).toContain('px-12');
      // The hidden replica stays available to re-measure if the screen gets wider
      expect(html).toContain('data-answer-probe=""');
    }
  });

  it('keeps answer order, colors, and the 1–4 key mapping in reading order', () => {
    const html = renderQuiz('grid', session(SHORT_VI));
    const buttons = answerButtons(html);
    buttons.forEach((button, index) => {
      expect(button.replace(/<[^>]+>/g, '').trim()).toBe(SHORT_VI.options![index]);
      expect(button).toContain(`bg-answer-${index + 1}-bg`);
    });
    // Keyboard 1–4 still selects options by their index (handler unchanged)
    const runner = readFileSync(resolve(__dirname, '../QuizRunnerScreen.tsx'), 'utf-8');
    expect(runner).toContain("current.question.options[Number(e.key) - 1]");
  });

  it('shows correct / wrong / reveal / muted feedback identically in the grid', () => {
    const answered = answerCurrentQuestion(session(SHORT_VI), 'du lịch');
    const html = renderQuiz('grid', answered);
    expect(layoutOf(html).layout).toBe('grid');
    const [correct, wrong, muted] = answerButtons(html);
    expect(correct).toContain('ring-success');
    expect(wrong).toContain('ring-error');
    expect(muted).toContain('opacity-60');
    for (const button of [correct, wrong, muted]) expect(button).toContain('aria-disabled="true"');
    // Feedback icons sit in the card corner, inside the padding, so the text never moves
    expect(correct).toMatch(/<svg[^>]*class="[^"]*absolute right-1\.5 top-1\.5[^"]*text-success/);
    expect(wrong).toMatch(/<svg[^>]*class="[^"]*absolute right-1\.5 top-1\.5[^"]*text-error/);
  });

  it('never affects written-answer questions', () => {
    for (const layout of ['grid', 'stacked'] as const) {
      const html = renderQuiz(layout, session(WRITTEN));
      expect(html).not.toContain('data-answer-layout');
      expect(html).not.toContain('data-answer-probe');
      expect(html).toContain('<input');
    }
  });

  it('keeps the grid measurement invisible and out of the page flow and accessibility tree', () => {
    const html = renderQuiz('grid', session(SHORT_VI));
    const probe = html.match(/<div aria-hidden="true" data-answer-probe="" class="([^"]*)"/)!;
    expect(probe[1]).toContain('absolute');
    expect(probe[1]).toContain('h-0');
    expect(probe[1]).toContain('overflow-hidden');
    expect(probe[1]).toContain('invisible');
    expect(probe[1]).toContain('pointer-events-none');
  });
});
