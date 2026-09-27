import { useCallback } from 'react';
import { useNavigation } from '../../hooks/useNavigation';
import { QuizSessionConfig } from '../../lib/quizSession';
import { useQuizSession } from './QuizSessionContext';

/**
 * Starts a session through the shared runner and opens it: `/quiz/session` for tests and
 * practice, `/quiz/review` for Review Missed Words. Returns false when the engine produced no
 * questions (callers keep the N = 0 state visible instead of navigating).
 */
export function useStartQuiz() {
  const { startSession } = useQuizSession();
  const { navigate, replace } = useNavigation();

  return useCallback(
    (config: QuizSessionConfig, options: { replaceCurrent?: boolean } = {}) => {
      const session = startSession(config);
      if (!session) return false;
      const route = config.kind === 'review' ? ({ type: 'quiz_review' } as const) : ({ type: 'quiz_session' } as const);
      if (options.replaceCurrent) replace(route);
      else navigate(route);
      return true;
    },
    [startSession, navigate, replace]
  );
}
