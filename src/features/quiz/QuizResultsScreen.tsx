import React, { useEffect, useRef } from 'react';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCards,
  IconClock,
  IconFlame,
  IconHome,
  IconRefresh,
  IconRotateClockwise,
  IconTarget,
  IconCircleCheck,
} from '@tabler/icons-react';
import { StudyItem } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { formatDuration } from '../../lib/quizSession';
import { QuizReturnIcon, formatQuizReturnLabel, getQuizReturnAction } from '../../lib/quizReturn';
import { Screen, ScreenHeader, SectionLabel, isDialogOpen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { InlineNotice } from '../study/StudyParts';
import { formatMeanings } from '../study/LessonItems';
import { buildReviewConfig, useQuizSession } from './QuizSessionContext';
import { QuizMessageScreen } from './QuizRunnerScreen';
import { useStartQuiz } from './useStartQuiz';

const RETURN_ICONS: Record<QuizReturnIcon, React.ReactNode> = {
  back: <IconArrowLeft size={20} stroke={2} />,
  test: <IconCards size={20} stroke={2} />,
  home: <IconHome size={20} stroke={2} />,
};

/**
 * Results keyboard: Enter on the page (not on a control) starts Review Missed; Escape takes the
 * same contextual return action as the return button.
 */
export function resultsKeyAction(key: string, onPage: boolean): 'review' | 'return' | null {
  if (key === 'Enter' && onPage) return 'review';
  if (key === 'Escape') return 'return';
  return null;
}

/**
 * SCREEN 14 — Quiz Results (`/quiz/results`).
 * Score, accuracy, best streak, time; the missed words; and Review / Retake / return actions. The
 * return action (and Escape) goes back to the quiz's originating study context, or Home.
 */
export const QuizResultsScreen: React.FC = () => {
  const { state } = useAppState();
  const { lastCompleted, saveError } = useQuizSession();
  const { navigate, returnTo } = useNavigation();
  const { t } = useI18n();
  const startQuiz = useStartQuiz();
  const goHome = () => navigate({ type: 'home' });
  const returnAction = getQuizReturnAction(lastCompleted?.config.returnTarget);
  const returnToOrigin = () => returnTo(returnAction.route);

  const itemsById = new Map<string, StudyItem>();
  for (const lesson of Object.values(state.lessons)) {
    for (const item of lesson.items) itemsById.set(item.id, item);
  }
  const missedItems = (lastCompleted?.result.missedItemIds ?? [])
    .map((id) => itemsById.get(id))
    .filter((item): item is StudyItem => item !== undefined);

  const reviewMissed = () => {
    if (!lastCompleted || missedItems.length === 0) return;
    startQuiz(
      buildReviewConfig(
        lastCompleted.config.lessonIds,
        missedItems.map((item) => item.id),
        state.lessons,
        lastCompleted.config.returnTarget
      )
    );
  };

  const retry = () => {
    if (lastCompleted) startQuiz(lastCompleted.config);
  };

  // Enter starts the review (when there are mistakes); Escape returns to the quiz's origin
  const keyRef = useRef({ reviewMissed, returnToOrigin });
  keyRef.current = { reviewMissed, returnToOrigin };
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isDialogOpen()) return;
      const target = e.target as HTMLElement | null;
      const action = resultsKeyAction(e.key, !target || target === document.body);
      if (!action) return;
      e.preventDefault();
      if (action === 'review') keyRef.current.reviewMissed();
      else keyRef.current.returnToOrigin();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!lastCompleted) {
    return <QuizMessageScreen title={t('app.name')} message={t('results.none')} onClose={goHome} />;
  }

  const { result, config } = lastCompleted;
  const title =
    config.kind === 'review'
      ? t('results.titleReview')
      : config.mode === 'practice'
        ? t('results.titlePractice')
        : t('results.titleTest');

  const metrics = [
    { icon: <IconCircleCheck size={20} stroke={2} />, label: t('results.score'), value: `${result.correctCount} / ${result.totalQuestions}` },
    { icon: <IconTarget size={20} stroke={2} />, label: t('results.accuracy'), value: `${result.accuracy}%` },
    { icon: <IconFlame size={20} stroke={2} />, label: t('results.bestStreak'), value: t('results.streakValue', { count: result.bestStreak }) },
    { icon: <IconClock size={20} stroke={2} />, label: t('results.time'), value: formatDuration(result.timeSpentSeconds) },
  ];

  return (
    <Screen width="2xl" header={<ScreenHeader title={title} width="2xl" />}>
      {saveError && (
        <div className="mb-4">
          <InlineNotice tone="warning" icon={<IconAlertTriangle size={18} stroke={2} />}>
            {t('quiz.saveError')}
          </InlineNotice>
        </div>
      )}

      <section aria-label={title} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-surface border border-border-subtle rounded-xl shadow-clay-card p-4 flex flex-col gap-2 min-w-0"
          >
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-text-secondary leading-snug">
              <span aria-hidden="true" className="text-primary shrink-0">
                {metric.icon}
              </span>
              {metric.label}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-text-primary leading-tight tabular-nums break-words">
              {metric.value}
            </span>
          </div>
        ))}
      </section>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {missedItems.length > 0 && (
          <Button
            variant="primary"
            size="lg"
            icon={<IconRefresh size={20} stroke={2} />}
            onClick={reviewMissed}
            className="sm:flex-1"
          >
            {t('results.reviewMissed', { count: missedItems.length })}
          </Button>
        )}
        <Button
          variant={missedItems.length > 0 ? 'secondary' : 'primary'}
          size="lg"
          icon={<IconRotateClockwise size={20} stroke={2} />}
          onClick={retry}
          className="sm:flex-1"
        >
          {t('results.retry')}
        </Button>
        <Button
          variant="quiet"
          size="lg"
          icon={RETURN_ICONS[returnAction.icon]}
          onClick={returnToOrigin}
          data-return-target={returnAction.route.type}
        >
          {formatQuizReturnLabel(returnAction, t)}
        </Button>
      </div>

      <section aria-labelledby="results-missed-heading" className="mt-8">
        <SectionLabel id="results-missed-heading" className="mb-2">
          {t('results.missed')}
        </SectionLabel>
        {missedItems.length === 0 ? (
          <InlineNotice icon={<IconCircleCheck size={18} stroke={2} />}>{t('results.perfect')}</InlineNotice>
        ) : (
          <ul className="bg-surface border border-border-subtle rounded-xl divide-y divide-border-subtle overflow-hidden">
            {missedItems.map((item) => (
              <li key={item.id} className="px-4 py-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span lang="ja" className="font-japanese text-lg font-bold text-text-primary break-words">
                  {item.japanese}
                </span>
                {item.kana && (
                  <span lang="ja" className="font-japanese text-sm text-text-secondary">
                    {item.kana}
                  </span>
                )}
                {item.hanViet && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{item.hanViet}</span>
                )}
                <span className="basis-full text-[15px] text-text-primary leading-relaxed break-words">
                  {formatMeanings(item)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Screen>
  );
};
