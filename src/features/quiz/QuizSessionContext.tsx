/**
 * Tango — Active Quiz Session Context
 *
 * Governed by:
 * - docs/ARCHITECTURE.md (§§2, 3: one shared quiz runner)
 * - docs/DATA_MODEL.md (§§3, 4)
 * - docs/screens/QUIZ_SESSION_SCREENS.md
 *
 * Holds the in-memory runtime of the one shared quiz runner. Every entry point (lesson practice,
 * quick test, category/book/mixed tests, review) starts a session here with a `QuizSessionConfig`;
 * questions always come from the locked quiz engine. Progress and history are written once, when a
 * session completes; an exited session is discarded ("not saved to history").
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import { QuizSessionResult } from '../../types';
import { generateQuizQuestions, getQuizEligibility } from '../../lib/quizEngine';
import {
  QuizSessionConfig,
  QuizSessionState,
  advanceQuizSession,
  answerCurrentQuestion,
  applyAnswersToProgress,
  buildQuizSessionResult,
  createQuizSession,
  ALL_QUESTION_TYPES,
  DEFAULT_QUESTION_TYPES,
} from '../../lib/quizSession';
import { createId } from '../../lib/ids';
import { getDeduplicationKey } from '../../lib/textNormalization';
import { useAppState } from '../../hooks/useAppState';
import { QuizReturnTarget } from '../../lib/quizReturn';

export interface CompletedQuiz {
  config: QuizSessionConfig;
  result: QuizSessionResult;
}

export interface QuizSessionContextValue {
  session: QuizSessionState | null;
  lastCompleted: CompletedQuiz | null;
  /** Generates questions with the shared engine and makes them the active session. */
  startSession: (config: QuizSessionConfig) => QuizSessionState | null;
  answer: (userAnswer: string) => QuizSessionState | null;
  /** Advances after feedback; when the last question is done, persists and returns the result. */
  advance: () => { state: QuizSessionState; completed: CompletedQuiz | null } | null;
  discardSession: () => void;
  /** Drops sessions/results referencing deleted lessons (hard-delete cascade step 2). */
  clearLessonReferences: (lessonIds: string[]) => void;
  saveError: boolean;
}

const QuizSessionContext = createContext<QuizSessionContextValue | null>(null);

/**
 * Review config for a set of missed items. Distractors come from the lessons the items belong to;
 * if the multiple-choice types cannot form 4 options, the written type is added as a fallback.
 * `returnTarget` is the ORIGINAL quiz origin (a review started from Results returns where the
 * reviewed quiz came from, never to the previous Results screen).
 */
export function buildReviewConfig(
  lessonIds: string[],
  focusItemIds: string[],
  lessons: Parameters<typeof getQuizEligibility>[1],
  returnTarget?: QuizReturnTarget
): QuizSessionConfig {
  const base: QuizSessionConfig = {
    lessonIds,
    mode: 'practice',
    questionCount: 'all',
    allowedTypes: DEFAULT_QUESTION_TYPES,
    focusItemIds,
    kind: 'review',
    ...(returnTarget ? { returnTarget } : {}),
  };
  // Compare against the number of distinct lexical groups the focus items belong to
  const focus = new Set(focusItemIds);
  const focusGroups = new Set<string>();
  for (const lessonId of lessonIds) {
    for (const item of lessons[lessonId]?.items ?? []) {
      if (focus.has(item.id)) focusGroups.add(getDeduplicationKey(item.japanese, item.kana));
    }
  }
  const eligibility = getQuizEligibility(base, lessons);
  if (eligibility.eligibleCount < focusGroups.size) {
    return { ...base, allowedTypes: ALL_QUESTION_TYPES };
  }
  return base;
}

export interface QuizSessionProviderProps {
  children: ReactNode;
  /** Pre-existing runtime (used by tests and server rendering); normally empty. */
  initialSession?: QuizSessionState | null;
  initialCompleted?: CompletedQuiz | null;
}

export const QuizSessionProvider: FC<QuizSessionProviderProps> = ({
  children,
  initialSession = null,
  initialCompleted = null,
}) => {
  const { state, commitStudyData } = useAppState();
  const [session, setSession] = useState<QuizSessionState | null>(initialSession);
  const [lastCompleted, setLastCompleted] = useState<CompletedQuiz | null>(initialCompleted);
  const [saveError, setSaveError] = useState(false);
  const sessionRef = useRef<QuizSessionState | null>(initialSession);
  const appStateRef = useRef(state);
  appStateRef.current = state;

  const setBoth = (next: QuizSessionState | null) => {
    sessionRef.current = next;
    setSession(next);
  };

  const startSession = useCallback((config: QuizSessionConfig) => {
    const questions = generateQuizQuestions(
      {
        lessonIds: config.lessonIds,
        allowedTypes: config.allowedTypes,
        questionCount: config.questionCount,
        mode: config.mode,
        focusItemIds: config.focusItemIds,
      },
      appStateRef.current.lessons
    );
    if (questions.length === 0) return null;
    const next = createQuizSession(config, questions, Date.now());
    setSaveError(false);
    setBoth(next);
    return next;
  }, []);

  const answer = useCallback((userAnswer: string) => {
    const current = sessionRef.current;
    if (!current) return null;
    const next = answerCurrentQuestion(current, userAnswer);
    setBoth(next);
    return next;
  }, []);

  const advance = useCallback(() => {
    const current = sessionRef.current;
    if (!current) return null;
    const next = advanceQuizSession(current, Date.now());
    setBoth(next);
    if (next.status !== 'finished' || current.status === 'finished') {
      return { state: next, completed: null };
    }

    const completedAt = new Date();
    const result = buildQuizSessionResult(next, createId('session'), completedAt);
    const completed: CompletedQuiz = { config: next.config, result };
    try {
      const appState = appStateRef.current;
      commitStudyData({
        progressByItem: applyAnswersToProgress(
          appState.progressByItem,
          next.answers,
          { clearWeakOnCorrect: next.config.kind === 'review' },
          completedAt.toISOString()
        ),
        recentResults: [...appState.recentResults, result],
      });
      setSaveError(false);
    } catch (error) {
      console.error('Failed to persist quiz results:', error);
      setSaveError(true);
    }
    setLastCompleted(completed);
    return { state: next, completed };
  }, [commitStudyData]);

  const discardSession = useCallback(() => {
    setBoth(null);
  }, []);

  const clearLessonReferences = useCallback((lessonIds: string[]) => {
    const affected = new Set(lessonIds);
    if (sessionRef.current?.config.lessonIds.some((id) => affected.has(id))) {
      setBoth(null);
    }
    setLastCompleted((current) =>
      current && current.config.lessonIds.some((id) => affected.has(id)) ? null : current
    );
  }, []);

  const value = useMemo<QuizSessionContextValue>(
    () => ({
      session,
      lastCompleted,
      startSession,
      answer,
      advance,
      discardSession,
      clearLessonReferences,
      saveError,
    }),
    [session, lastCompleted, startSession, answer, advance, discardSession, clearLessonReferences, saveError]
  );

  return <QuizSessionContext.Provider value={value}>{children}</QuizSessionContext.Provider>;
};

export function useQuizSession(): QuizSessionContextValue {
  const context = useContext(QuizSessionContext);
  if (!context) {
    throw new Error('useQuizSession must be used within a QuizSessionProvider');
  }
  return context;
}
