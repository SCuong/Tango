import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { App } from '../../../App';
import { AppStateProvider } from '../../../hooks/useAppState';
import { NavigationProvider } from '../../../hooks/useNavigation';
import { QuizSessionContextValue, QuizSessionProvider, useQuizSession } from '../QuizSessionContext';
import { CORRECT_AUTO_ADVANCE_MS, InlineExplanation, QuizRunnerScreen } from '../QuizRunnerScreen';
import { dismissModalHistory } from '../../../components/Dialog';
import { AnswerLayout, IncorrectFeedback, QuestionType, QuizQuestion, StudyItem, UserStudyState } from '../../../types';
import { QuizSessionState, answerCurrentQuestion, createQuizSession } from '../../../lib/quizSession';

const jissai = { id: 'i1', japanese: '実際', kana: 'じっさい', hanViet: 'THỰC TẾ', vietnamese: ['thực tế'] };
const tabi = { id: 'i2', japanese: '旅行', kana: 'りょこう', vietnamese: ['du lịch'] };

function question(id: string, type: QuestionType, options: string[] | undefined, correctAnswer: string, targetItem: StudyItem = jissai): QuizQuestion {
  return { id, type, prompt: targetItem.japanese, correctAnswer, options, targetItem };
}

const MC = question('q-1', 'japanese_to_vi', ['thực tế', 'du lịch', 'lễ nghi', 'cảnh quan'], 'thực tế');
const MC_NEXT = question('q-2', 'japanese_to_vi', ['du lịch', 'thực tế', 'lễ nghi', 'cảnh quan'], 'du lịch', tabi);
const WRITTEN = question('q-1', 'vi_to_text', undefined, '実際');

function session(questions: QuizQuestion[], answer?: string): QuizSessionState {
  const created = createQuizSession(
    { lessonIds: ['l1'], mode: 'test', questionCount: 'all', allowedTypes: [questions[0].type], kind: 'standard' },
    questions,
    Date.now()
  );
  return answer === undefined ? created : answerCurrentQuestion(created, answer);
}

function state(incorrectFeedback: IncorrectFeedback, answerLayout: AnswerLayout = 'grid'): UserStudyState {
  return {
    version: 1,
    preferences: { theme: 'light', language: 'vi', soundEnabled: false, answerLayout, incorrectFeedback },
    books: {},
    lessons: {},
    progressByItem: {},
    recentResults: [],
  };
}

function render(incorrectFeedback: IncorrectFeedback, quiz: QuizSessionState, answerLayout: AnswerLayout = 'grid'): string {
  return renderToString(
    <AppStateProvider initialState={state(incorrectFeedback, answerLayout)}>
      <NavigationProvider initialPath="/quiz/session">
        <QuizSessionProvider initialSession={quiz}>
          <App />
        </QuizSessionProvider>
      </NavigationProvider>
    </AppStateProvider>
  );
}

const text = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** The inline explanation section's HTML. */
function inlineSection(html: string): string {
  const open = html.lastIndexOf('<section', html.indexOf('data-inline-explanation=""'));
  return html.slice(open, html.indexOf('</section>', open) + '</section>'.length);
}

/** The popup panel's HTML (without the mobile sheet handle). */
function dialogPanel(html: string): string {
  const open = html.indexOf('role="dialog"');
  const panel = html.slice(html.lastIndexOf('<div', open));
  return panel.replace(/<div class="sm:hidden mx-auto[^"]*" aria-hidden="true"><\/div>/, '');
}

/** Divs opened minus closed between two offsets (0 = the first element is fully closed). */
function divDepth(html: string, from: number, to: number): number {
  const slice = html.slice(from, to);
  return (slice.match(/<div[\s>]/g) ?? []).length - (slice.match(/<\/div>/g) ?? []).length;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('incorrect-answer feedback at runtime', () => {
  it('popup: a wrong answer opens the explanation sheet dialog, with no inline explanation', () => {
    const html = render('popup', session([MC, MC_NEXT], 'du lịch'));
    expect(html).toContain('data-tango-dialog="true"');
    expect(html).toMatch(/role="dialog" aria-modal="true" aria-labelledby="[^"]+"/);
    expect(html).toContain('tango-sheet');
    expect(html).toContain('tango-backdrop');
    expect(text(dialogPanel(html))).toContain('Đã hiểu — Tiếp tục');
    expect(html).not.toContain('data-inline-explanation');
  });

  it('inline: a wrong answer shows the explanation below the answers, with no dialog, backdrop, or blur', () => {
    const html = render('inline', session([MC, MC_NEXT], 'du lịch'));
    expect(html).toContain('data-inline-explanation=""');
    expect(html).not.toContain('data-tango-dialog');
    expect(html).not.toContain('aria-modal');
    expect(html).not.toContain('tango-backdrop');
    expect(html).not.toContain('backdrop-blur');
    const section = inlineSection(html);
    expect(section).toMatch(/class="mt-4 rounded-2xl border border-dashed border-error-border bg-error-surface/);
    expect(section).not.toMatch(/fixed|absolute|shadow-clay/);
    // It follows the four answers (after them in document order) inside the answer stage
    expect(html.indexOf('data-inline-explanation=""')).toBeGreaterThan(html.lastIndexOf('aria-label="Lựa chọn: '));
    // Labelled by its own title and announced politely
    const titleId = section.match(/aria-labelledby="([^"]+)"/)![1];
    expect(section).toContain(`id="${titleId}"`);
    expect(html).toMatch(/<div aria-live="polite" data-inline-explanation-region=""><section/);
  });

  it('inline shows exactly the same study explanation as the popup', () => {
    const popup = text(dialogPanel(render('popup', session([MC, MC_NEXT], 'du lịch'))));
    const inline = text(inlineSection(render('inline', session([MC, MC_NEXT], 'du lịch'))));
    for (const part of ['Chưa chính xác', '実際', 'じっさい', 'Hán Việt', 'THỰC TẾ', 'Nghĩa', 'thực tế', 'Đã hiểu — Tiếp tục']) {
      expect(inline, part).toContain(part);
    }
    expect(popup.startsWith(inline)).toBe(true);
  });

  it('inline Continue advances to the next question (wrong answers never auto-advance)', () => {
    let ctx: QuizSessionContextValue | null = null;
    let inlineProps: React.ComponentProps<typeof InlineExplanation> | null = null;
    const Capture = () => {
      ctx = useQuizSession();
      const runner = QuizRunnerScreen({ review: false }) as React.ReactElement;
      const tree = (runner.type as React.FC<unknown>)(runner.props);
      const walk = (node: unknown) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== 'object' || !('props' in node)) return;
        const element = node as React.ReactElement;
        if (element.type === InlineExplanation) inlineProps = element.props as React.ComponentProps<typeof InlineExplanation>;
        walk((element.props as { children?: unknown }).children);
      };
      walk(tree);
      return null;
    };
    renderToString(
      <AppStateProvider initialState={state('inline')}>
        <NavigationProvider initialPath="/quiz/session">
          <QuizSessionProvider initialSession={session([MC, MC_NEXT], 'du lịch')}>
            <Capture />
          </QuizSessionProvider>
        </NavigationProvider>
      </AppStateProvider>
    );
    expect(inlineProps).not.toBeNull();
    inlineProps!.onContinue();
    // The runtime moved on: the next answer is evaluated against question 2
    const next = ctx!.answer('du lịch');
    expect(next?.currentIndex).toBe(1);
    expect(next?.lastAnswer).toMatchObject({ questionId: 'q-2', isCorrect: true });
  });

  it('a correct answer is unchanged: status message, auto-advance, no explanation in either style', () => {
    expect(CORRECT_AUTO_ADVANCE_MS).toBe(750);
    for (const style of ['popup', 'inline'] as const) {
      const html = render(style, session([MC, MC_NEXT], 'thực tế'));
      expect(html, style).toContain('role="status"');
      expect(html, style).toContain('Chính xác!');
      expect(html, style).not.toContain('data-inline-explanation=""');
      expect(html, style).not.toContain('data-tango-dialog');
    }
  });

  it('written answers: a wrong answer + inline shows the explanation below the input, no popup', () => {
    const html = render('inline', session([WRITTEN], 'sai'));
    expect(html).not.toContain('data-tango-dialog');
    const section = inlineSection(html);
    expect(text(section)).toContain('Bạn đã trả lời: sai');
    expect(text(section)).toContain('実際');
    expect(html.indexOf('data-inline-explanation=""')).toBeGreaterThan(html.indexOf('</form>'));
    // Popup style keeps the sheet for written answers too
    expect(render('popup', session([WRITTEN], 'sai'))).toContain('data-tango-dialog="true"');
  });

  it('Grid 2×2 + inline: the explanation spans the full width below the grid, never a fifth cell', () => {
    const html = render('inline', session([MC, MC_NEXT], 'du lịch'), 'grid');
    const container = html.indexOf('data-answer-layout="grid"');
    const region = html.indexOf('data-inline-explanation-region');
    expect(container).toBeGreaterThan(-1);
    expect(html).toContain('grid grid-cols-2 auto-rows-fr gap-3');
    // The answer container (grid included) is fully closed before the explanation starts
    const containerOpen = html.lastIndexOf('<div', container);
    expect(divDepth(html, containerOpen, html.lastIndexOf('<div', region))).toBe(0);
    // Feedback states on the answers are kept
    expect(html).toContain('ring-error');
    expect(html).toContain('ring-success');
    expect(html).toContain('opacity-60');
  });

  it('Stacked + inline: the explanation follows the last answer', () => {
    const html = render('inline', session([MC, MC_NEXT], 'du lịch'), 'stacked');
    const container = html.indexOf('data-answer-layout="stacked"');
    const region = html.indexOf('data-inline-explanation-region');
    expect(divDepth(html, html.lastIndexOf('<div', container), html.lastIndexOf('<div', region))).toBe(0);
    expect(region).toBeGreaterThan(html.lastIndexOf('aria-label="Lựa chọn: '));
  });

  it('popup keeps its dialog; closing history is safe when no popup marker exists', async () => {
    const html = render('popup', session([MC, MC_NEXT], 'du lịch'));
    expect(html).toMatch(/role="dialog" aria-modal="true"/);
    // Inline never opens a dialog, so there is no history marker to pop
    vi.stubGlobal('window', { history: { state: null, back: vi.fn() } });
    await expect(dismissModalHistory()).resolves.toBeUndefined();
    expect((window.history.back as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });
});
