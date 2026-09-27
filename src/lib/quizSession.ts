/**
 * Tango — Pure Quiz Session Runner State
 *
 * Governed by:
 * - docs/DATA_MODEL.md (§§3.2, 3.3, 4, 4.3)
 * - docs/PRODUCT_SPEC.md (§§5, 6, 7)
 * - docs/screens/QUIZ_SESSION_SCREENS.md (SCREEN 10 – 15)
 *
 * The locked quiz engine (`quizEngine.ts`) generates the initial questions; this module only
 * runs them: answer evaluation (through `evaluateQuizAnswer`), streaks, Practice Mode re-queueing,
 * and the lightweight `QuizSessionResult` summary. It has no React or storage side effects.
 */

import { ItemProgress, QuestionType, QuizMode, QuizQuestion, QuizSessionResult } from '../types';
import { evaluateQuizAnswer } from './quizEngine';

/** Every quiz entry point (lesson, category, book, mixed, review) runs through this config. */
export interface QuizSessionConfig {
  lessonIds: string[];
  mode: QuizMode;
  questionCount: number | 'all';
  allowedTypes: QuestionType[];
  /** Review Missed Words: restricts targets to these real StudyItem IDs. */
  focusItemIds?: string[];
  /** Review sessions clear the weak flag of items answered correctly (DATA_MODEL §4.3). */
  kind: 'standard' | 'review';
}

export interface QuizAnswerRecord {
  questionId: string;
  itemId: string;
  type: QuestionType;
  userAnswer: string;
  isCorrect: boolean;
  /** True for Practice Mode re-queued repeats; they never change the score. */
  isRetry: boolean;
}

export type QuizSessionStatus = 'answering' | 'feedback' | 'finished';

export interface QuizSessionState {
  config: QuizSessionConfig;
  /** Initial questions followed by Practice Mode re-queued repeats. */
  queue: QuizQuestion[];
  initialCount: number;
  currentIndex: number;
  status: QuizSessionStatus;
  /** Answer given for the current question while its feedback is shown. */
  lastAnswer: QuizAnswerRecord | null;
  answers: QuizAnswerRecord[];
  streak: number;
  bestStreak: number;
  missedItemIds: string[];
  startedAt: number;
  finishedAt: number | null;
}

/** Default formats for quiz configuration screens: the three multiple-choice types. */
export const DEFAULT_QUESTION_TYPES: QuestionType[] = [
  'kana_to_japanese',
  'japanese_to_vi',
  'vi_to_japanese',
];

/** All selectable formats, in configuration-screen order. */
export const ALL_QUESTION_TYPES: QuestionType[] = [...DEFAULT_QUESTION_TYPES, 'vi_to_text'];

const RETRY_SUFFIX = '-r';

export function createQuizSession(
  config: QuizSessionConfig,
  questions: QuizQuestion[],
  now: number
): QuizSessionState {
  return {
    config,
    queue: questions,
    initialCount: questions.length,
    currentIndex: 0,
    status: questions.length > 0 ? 'answering' : 'finished',
    lastAnswer: null,
    answers: [],
    streak: 0,
    bestStreak: 0,
    missedItemIds: [],
    startedAt: now,
    finishedAt: questions.length > 0 ? null : now,
  };
}

export function getCurrentQuestion(state: QuizSessionState): QuizQuestion | null {
  return state.queue[state.currentIndex] ?? null;
}

function isRetryQuestion(question: QuizQuestion): boolean {
  return question.id.includes(RETRY_SUFFIX);
}

/**
 * Evaluates an answer for the current question and enters the feedback state.
 * Ignored unless the session is waiting for an answer.
 */
export function answerCurrentQuestion(
  state: QuizSessionState,
  userAnswer: string
): QuizSessionState {
  const question = getCurrentQuestion(state);
  if (state.status !== 'answering' || !question) return state;

  const isCorrect = evaluateQuizAnswer(question, userAnswer);
  const itemId = question.targetItem.id;
  const record: QuizAnswerRecord = {
    questionId: question.id,
    itemId,
    type: question.type,
    userAnswer,
    isCorrect,
    isRetry: isRetryQuestion(question),
  };

  const streak = isCorrect ? state.streak + 1 : 0;
  const missedItemIds =
    !isCorrect && !state.missedItemIds.includes(itemId)
      ? [...state.missedItemIds, itemId]
      : state.missedItemIds;

  // Practice Mode re-queues a missed question at the end until it is answered correctly
  let queue = state.queue;
  if (!isCorrect && state.config.mode === 'practice') {
    const retryCount = state.queue.filter((q) => q.targetItem.id === itemId).length;
    const baseId = question.id.split(RETRY_SUFFIX)[0];
    queue = [
      ...state.queue,
      { ...question, id: `${baseId}${RETRY_SUFFIX}${retryCount}`, userAnswer: undefined, isCorrect: undefined },
    ];
  }

  return {
    ...state,
    queue,
    status: 'feedback',
    lastAnswer: record,
    answers: [...state.answers, record],
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    missedItemIds,
  };
}

/** Leaves the feedback state: next question, or finished after the last one. */
export function advanceQuizSession(state: QuizSessionState, now: number): QuizSessionState {
  if (state.status !== 'feedback') return state;
  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.queue.length) {
    return { ...state, status: 'finished', lastAnswer: null, finishedAt: now };
  }
  return { ...state, currentIndex: nextIndex, status: 'answering', lastAnswer: null };
}

/** Score counts first attempts only; Practice repeats never inflate or deflate it. */
export function getFirstAttemptCorrectCount(state: QuizSessionState): number {
  return state.answers.filter((a) => !a.isRetry && a.isCorrect).length;
}

export function getElapsedSeconds(state: QuizSessionState, now: number): number {
  const end = state.finishedAt ?? now;
  return Math.max(0, Math.round((end - state.startedAt) / 1000));
}

/** Lightweight summary persisted to `tango_v1_history` (DATA_MODEL §4.2). */
export function buildQuizSessionResult(
  state: QuizSessionState,
  sessionId: string,
  completedAt: Date
): QuizSessionResult {
  const totalQuestions = state.initialCount;
  const correctCount = getFirstAttemptCorrectCount(state);
  return {
    sessionId,
    lessonIds: [...state.config.lessonIds],
    mode: state.config.mode,
    totalQuestions,
    correctCount,
    incorrectCount: totalQuestions - correctCount,
    accuracy: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
    bestStreak: state.bestStreak,
    timeSpentSeconds: getElapsedSeconds(state, completedAt.getTime()),
    missedItemIds: [...state.missedItemIds],
    completedAt: completedAt.toISOString(),
  };
}

/**
 * Applies every answer of a completed session to item progress (a new map; input untouched).
 * - Every answer is an attempt.
 * - An incorrect answer records `lastMistakeAt` and marks the item weak.
 * - In review sessions a correct answer clears the weak flag (DATA_MODEL §4.3).
 */
export function applyAnswersToProgress(
  progressByItem: Record<string, ItemProgress>,
  answers: QuizAnswerRecord[],
  options: { clearWeakOnCorrect: boolean },
  nowIso: string
): Record<string, ItemProgress> {
  const next: Record<string, ItemProgress> = { ...progressByItem };
  for (const answer of answers) {
    const previous = next[answer.itemId];
    const base: ItemProgress = previous
      ? { ...previous }
      : {
          itemId: answer.itemId,
          totalAttempts: 0,
          correctCount: 0,
          incorrectCount: 0,
          lastStudiedAt: nowIso,
          isMarkedWeak: false,
        };
    base.totalAttempts += 1;
    base.lastStudiedAt = nowIso;
    if (answer.isCorrect) {
      base.correctCount += 1;
      if (options.clearWeakOnCorrect) base.isMarkedWeak = false;
    } else {
      base.incorrectCount += 1;
      base.lastMistakeAt = nowIso;
      base.isMarkedWeak = true;
    }
    next[answer.itemId] = base;
  }
  return next;
}

/** mm:ss for the HUD timer and result card. */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
