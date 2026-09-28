import { readFileSync } from 'fs';
import { resolve } from 'path';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { AppStateProvider } from '../../../hooks/useAppState';
import { NavigationProvider } from '../../../hooks/useNavigation';
import { AppTheme, StudyBook, UserStudyState } from '../../../types';
import { HomeStudyHub } from '../HomeStudyHub';
import { QuizSessionProvider, CompletedQuiz } from '../../quiz/QuizSessionContext';
import { QuizResultsScreen } from '../../quiz/QuizResultsScreen';
import { QuizReturnTarget } from '../../../lib/quizReturn';

const book = (id: string, title: string): StudyBook => ({ id, title, createdAt: 'x', updatedAt: 'x' });

function state(theme: AppTheme): UserStudyState {
  return {
    version: 1,
    preferences: { theme, language: 'vi', soundEnabled: false, answerLayout: 'grid', incorrectFeedback: 'inline' },
    books: { b1: book('b1', 'みんなの日本語 I'), b2: book('b2', '中級へ行こう'), b3: book('b3', 'TRY! N3') },
    lessons: {},
    progressByItem: {},
    recentResults: [],
  };
}

function completed(returnTarget?: QuizReturnTarget): CompletedQuiz {
  return {
    config: { lessonIds: ['l1'], mode: 'test', questionCount: 'all', allowedTypes: ['japanese_to_vi'], kind: 'standard', returnTarget },
    result: {
      sessionId: 's', lessonIds: ['l1'], mode: 'test', totalQuestions: 4, correctCount: 4, incorrectCount: 0,
      accuracy: 100, bestStreak: 4, timeSpentSeconds: 20, missedItemIds: [], completedAt: 'x',
    },
  };
}

const css = readFileSync(resolve(__dirname, '../../../index.css'), 'utf-8');

describe("Meo's World secondary actions on the illustrated canvas", () => {
  it('Home "Xem tất cả" keeps its dashed identity and carries the readable-surface class', () => {
    const html = renderToString(
      <AppStateProvider initialState={state('meo')}>
        <NavigationProvider initialPath="/">
          <HomeStudyHub />
        </NavigationProvider>
      </AppStateProvider>
    );
    const toggle = html.match(/<button[^>]*aria-controls="home-more-books"[^>]*>/)![0];
    expect(toggle).toMatch(/class="tango-canvas-secondary inline-flex [^"]*w-\[62%\][^"]*border border-dashed border-border-strong/);
    expect(toggle).toContain('aria-expanded="false"');
  });

  it('every Results return action (and the Home fallback) carries the readable-surface classes', () => {
    const targets: (QuizReturnTarget | undefined)[] = [
      { type: 'lesson_detail', lessonId: 'l1' },
      { type: 'category_inside_book', bookId: 'b1', category: 'kanji' },
      { type: 'category_inside_book', bookId: 'b1', category: 'vocabulary' },
      { type: 'book_study', bookId: 'b1' },
      { type: 'mixed_quiz_config' },
      undefined,
    ];
    for (const target of targets) {
      const html = renderToString(
        <AppStateProvider initialState={state('meo')}>
          <NavigationProvider initialPath="/quiz/results">
            <QuizSessionProvider initialCompleted={completed(target)}>
              <QuizResultsScreen />
            </QuizSessionProvider>
          </NavigationProvider>
        </AppStateProvider>
      );
      const button = html.match(/<button[^>]*data-return-target="[^"]+"[^>]*>/)![0];
      expect(button, JSON.stringify(target)).toContain('tango-canvas-secondary tango-canvas-secondary-outline');
      // Still the quiet (flat) action: no clay depth, below Review Missed and Retry
      expect(button).toContain('flat-interactive');
      expect(button).not.toContain('shadow-clay');
    }
  });

  it('applies an opaque cream surface and strong text only in Meo\'s World', () => {
    const surface = css.match(/\[data-theme="meo"\] \.tango-canvas-secondary \{([^}]*)\}/)![1];
    expect(surface).toContain('background-color: var(--bg-surface);');
    expect(surface).toContain('color: var(--text-primary);');
    expect(css).toMatch(/\[data-theme="meo"\] \.tango-canvas-secondary-outline \{\s*border-color: var\(--border-strong\);/);
    expect(css).toMatch(/\[data-theme="meo"\] \.tango-canvas-secondary\[data-pressed="true"\] \{\s*background-color: var\(--bg-surface-elevated\);/);
    // Every rule for these classes is scoped to Meo's World: other themes keep their look
    const rules = css.match(/^[^\n{}]*\.tango-canvas-secondary[^{]*\{/gm) ?? [];
    expect(rules.length).toBeGreaterThanOrEqual(4);
    for (const rule of rules) expect(rule.trim(), rule).toMatch(/^\[data-theme="meo"\] /);
  });
});
