import { describe, it, expect } from 'vitest';
import { Lesson } from '../../types';
import { generateQuizQuestions, getQuizEligibility } from '../quizEngine';
import {
  QuizSessionConfig,
  advanceQuizSession,
  answerCurrentQuestion,
  applyAnswersToProgress,
  buildQuizSessionResult,
  createQuizSession,
  formatDuration,
  getCurrentQuestion,
  DEFAULT_QUESTION_TYPES,
} from '../quizSession';

const lesson: Lesson = {
  id: 'l1',
  category: 'vocabulary',
  title: 'Bài 1',
  items: [
    { id: 'i1', japanese: '旅行', kana: 'りょこう', vietnamese: ['du lịch'] },
    { id: 'i2', japanese: '実際', kana: 'じっさい', vietnamese: ['thực tế'] },
    { id: 'i3', japanese: '礼儀', kana: 'れいぎ', vietnamese: ['lễ nghi'] },
    { id: 'i4', japanese: '景観', kana: 'けいかん', vietnamese: ['cảnh quan'] },
    { id: 'i5', japanese: '家族', kana: 'かぞく', vietnamese: ['gia đình'] },
  ],
};
const lessons = { l1: lesson };

function config(mode: QuizSessionConfig['mode']): QuizSessionConfig {
  return { lessonIds: ['l1'], mode, questionCount: 'all', allowedTypes: DEFAULT_QUESTION_TYPES, kind: 'standard' };
}

function start(mode: QuizSessionConfig['mode']) {
  const questions = generateQuizQuestions(config(mode), lessons, () => 0.3);
  return createQuizSession(config(mode), questions, 1_000);
}

function wrongOption(state: ReturnType<typeof start>) {
  const q = getCurrentQuestion(state)!;
  return q.options!.find((o) => o !== q.correctAnswer)!;
}

describe('quizSession runner', () => {
  it('runs one question per eligible lexical group and finishes after the last', () => {
    let state = start('test');
    expect(state.initialCount).toBe(5);
    for (let i = 0; i < 5; i++) {
      state = answerCurrentQuestion(state, getCurrentQuestion(state)!.correctAnswer);
      expect(state.status).toBe('feedback');
      state = advanceQuizSession(state, 2_000 + i);
    }
    expect(state.status).toBe('finished');
    expect(state.bestStreak).toBe(5);
    expect(state.missedItemIds).toEqual([]);
  });

  it('never re-queues in test mode and records missed items once', () => {
    let state = start('test');
    const missedId = getCurrentQuestion(state)!.targetItem.id;
    state = answerCurrentQuestion(state, wrongOption(state));
    expect(state.lastAnswer?.isCorrect).toBe(false);
    expect(state.streak).toBe(0);
    expect(state.queue).toHaveLength(5);
    expect(state.missedItemIds).toEqual([missedId]);
  });

  it('re-queues missed questions in practice mode until answered correctly, scoring first attempts only', () => {
    let state = start('practice');
    const missedId = getCurrentQuestion(state)!.targetItem.id;
    state = answerCurrentQuestion(state, wrongOption(state));
    expect(state.queue).toHaveLength(6);
    expect(state.queue[5].targetItem.id).toBe(missedId);
    expect(state.queue[5].id).not.toBe(state.queue[0].id);
    state = advanceQuizSession(state, 2_000);
    while (state.status !== 'finished') {
      state = answerCurrentQuestion(state, getCurrentQuestion(state)!.correctAnswer);
      state = advanceQuizSession(state, 3_000);
    }
    expect(state.answers).toHaveLength(6);
    expect(state.answers[5].isRetry).toBe(true);

    const result = buildQuizSessionResult(state, 'session_x', new Date(31_000));
    expect(result.totalQuestions).toBe(5);
    expect(result.correctCount).toBe(4);
    expect(result.incorrectCount).toBe(1);
    expect(result.accuracy).toBe(80);
    expect(result.missedItemIds).toEqual([missedId]);
    expect(result.timeSpentSeconds).toBe(2); // measured to the moment the last question finished
    expect(result.lessonIds).toEqual(['l1']);
  });

  it('ignores answers while feedback is shown', () => {
    let state = start('test');
    state = answerCurrentQuestion(state, getCurrentQuestion(state)!.correctAnswer);
    const again = answerCurrentQuestion(state, 'x');
    expect(again).toBe(state);
  });

  it('creates an already finished session for an empty question list', () => {
    const state = createQuizSession(config('test'), [], 5);
    expect(state.status).toBe('finished');
  });
});

describe('applyAnswersToProgress', () => {
  const answers = [
    { questionId: 'q-1', itemId: 'i1', type: 'kana_to_japanese' as const, userAnswer: 'x', isCorrect: false, isRetry: false },
    { questionId: 'q-1-r1', itemId: 'i1', type: 'kana_to_japanese' as const, userAnswer: '旅行', isCorrect: true, isRetry: true },
    { questionId: 'q-2', itemId: 'i2', type: 'japanese_to_vi' as const, userAnswer: 'thực tế', isCorrect: true, isRetry: false },
  ];

  it('counts every answer as an attempt and marks mistakes weak', () => {
    const before = {};
    const next = applyAnswersToProgress(before, answers, { clearWeakOnCorrect: false }, '2026-01-01T00:00:00.000Z');
    expect(before).toEqual({});
    expect(next.i1).toMatchObject({ totalAttempts: 2, correctCount: 1, incorrectCount: 1, isMarkedWeak: true });
    expect(next.i1.lastMistakeAt).toBe('2026-01-01T00:00:00.000Z');
    expect(next.i2).toMatchObject({ totalAttempts: 1, correctCount: 1, isMarkedWeak: false });
  });

  it('clears the weak flag on correct answers only in review sessions', () => {
    const weak = {
      i2: { itemId: 'i2', totalAttempts: 3, correctCount: 1, incorrectCount: 2, lastStudiedAt: 'x', isMarkedWeak: true },
    };
    expect(applyAnswersToProgress(weak, [answers[2]], { clearWeakOnCorrect: false }, 'n').i2.isMarkedWeak).toBe(true);
    expect(applyAnswersToProgress(weak, [answers[2]], { clearWeakOnCorrect: true }, 'n').i2.isMarkedWeak).toBe(false);
  });
});

describe('quiz engine review focus (focusItemIds)', () => {
  it('limits eligible groups to focus items while drawing distractors from the whole pool', () => {
    const cfg = { lessonIds: ['l1'], allowedTypes: DEFAULT_QUESTION_TYPES, focusItemIds: ['i2', 'i4'] };
    expect(getQuizEligibility(cfg, lessons).eligibleCount).toBe(2);
    const questions = generateQuizQuestions({ ...cfg, questionCount: 'all' }, lessons);
    expect(questions.map((q) => q.targetItem.id).sort()).toEqual(['i2', 'i4']);
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
    }
  });

  it('keeps the unfocused behavior unchanged', () => {
    expect(getQuizEligibility(['l1'], lessons, DEFAULT_QUESTION_TYPES).eligibleCount).toBe(5);
  });
});

describe('formatDuration', () => {
  it('formats mm:ss', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(100)).toBe('01:40');
    expect(formatDuration(3599)).toBe('59:59');
  });
});

describe('buildReviewConfig', () => {
  it('keeps multiple-choice types when weak items share one lexical group', async () => {
    const { buildReviewConfig } = await import('../../features/quiz/QuizSessionContext');
    const withDuplicate: Lesson = {
      ...lesson,
      items: [...lesson.items, { id: 'i1b', japanese: '旅行', kana: 'りょこう', vietnamese: ['du lịch'] }],
    };
    const config = buildReviewConfig(['l1'], ['i1', 'i1b'], { l1: withDuplicate });
    expect(config.allowedTypes).toEqual(DEFAULT_QUESTION_TYPES);
    expect(config.kind).toBe('review');
    expect(config.focusItemIds).toEqual(['i1', 'i1b']);
  });

  it('adds the written type when multiple choice cannot cover a focus item', async () => {
    const { buildReviewConfig } = await import('../../features/quiz/QuizSessionContext');
    const tiny: Lesson = { ...lesson, items: lesson.items.slice(0, 2) }; // only 1 possible distractor
    const config = buildReviewConfig(['l1'], ['i1'], { l1: tiny });
    expect(config.allowedTypes).toContain('vi_to_text');
  });
});
