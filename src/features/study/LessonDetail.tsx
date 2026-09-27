import React, { useEffect, useRef } from 'react';
import {
  IconAlertTriangle,
  IconBrain,
  IconChevronRight,
  IconClock,
  IconList,
  IconRefresh,
} from '@tabler/icons-react';
import { Lesson } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { useCounts } from '../../hooks/useCounts';
import { CLAY_PRESSED_CLASSES, usePressFeedback } from '../../hooks/usePressFeedback';
import { getLessonStudyMetrics } from '../../lib/studyMetrics';
import { getAvailableQuestionCounts, getQuizEligibility } from '../../lib/quizEngine';
import { DEFAULT_QUESTION_TYPES } from '../../lib/quizSession';
import { getWeakItemIds } from '../../lib/studySelectors';
import { Screen, ScreenHeader, SectionLabel, isDialogOpen } from '../../components/Screen';
import { Button, FOCUS_RING } from '../../components/Button';
import { NotFoundScreen } from '../../components/NotFoundScreen';
import { buildReviewConfig } from '../quiz/QuizSessionContext';
import { useStartQuiz } from '../quiz/useStartQuiz';
import { CATEGORY_LABEL_KEYS, InlineNotice } from './StudyParts';

/**
 * SCREEN 05 — Lesson Detail (`/lesson/:lessonId`).
 * Study actions first (Practice, Quick Test, word list, Review Missed), never auto-starting a quiz.
 * Keys 1–4 trigger the four actions on desktop.
 */
export const LessonDetail: React.FC<{ lessonId: string }> = ({ lessonId }) => {
  const { state } = useAppState();
  const { navigate, goBack } = useNavigation();
  const { t } = useI18n();
  const counts = useCounts();
  const startQuiz = useStartQuiz();
  const quickTestRef = useRef<HTMLDivElement>(null);
  const lesson: Lesson | undefined = state.lessons[lessonId];
  const book = lesson?.bookId ? state.books[lesson.bookId] : undefined;

  const parentRoute = lesson
    ? book
      ? ({ type: 'category_inside_book', bookId: book.id, category: lesson.category } as const)
      : ({ type: 'learn_by_type', category: lesson.category } as const)
    : ({ type: 'home' } as const);
  const goParent = () => goBack(parentRoute);

  const eligibility = lesson
    ? getQuizEligibility([lesson.id], state.lessons, DEFAULT_QUESTION_TYPES)
    : { eligibleCount: 0, rawItemCount: 0, hasEligibleQuestions: false };
  const n = eligibility.eligibleCount;
  const weakItemIds = lesson ? getWeakItemIds([lesson], state.progressByItem) : [];

  const startPractice = () => {
    if (!lesson || n === 0) return;
    startQuiz({
      lessonIds: [lesson.id],
      mode: 'practice',
      questionCount: 'all',
      allowedTypes: DEFAULT_QUESTION_TYPES,
      kind: 'standard',
    });
  };

  const startQuickTest = (questionCount: number | 'all') => {
    if (!lesson || n === 0) return;
    startQuiz({
      lessonIds: [lesson.id],
      mode: 'test',
      questionCount,
      allowedTypes: DEFAULT_QUESTION_TYPES,
      kind: 'standard',
    });
  };

  const openItems = () => lesson && navigate({ type: 'lesson_items', lessonId: lesson.id });

  const startReview = () => {
    if (!lesson) return;
    const started =
      weakItemIds.length > 0 &&
      startQuiz(buildReviewConfig([lesson.id], weakItemIds, state.lessons));
    if (!started) navigate({ type: 'quiz_review' });
  };

  // Desktop accelerators: 1 Practice, 2 Quick Test (focus the counts), 3 word list, 4 review
  const actionsRef = useRef({ startPractice, openItems, startReview });
  actionsRef.current = { startPractice, openItems, startReview };
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isDialogOpen()) return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (e.key === '1') actionsRef.current.startPractice();
      else if (e.key === '2') quickTestRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
      else if (e.key === '3') actionsRef.current.openItems();
      else if (e.key === '4') actionsRef.current.startReview();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!lesson) {
    return <NotFoundScreen message={t('common.notFound.lesson')} onBack={goParent} />;
  }

  const metrics = getLessonStudyMetrics(lesson, state.progressByItem);
  const categoryLabel = t(CATEGORY_LABEL_KEYS[lesson.category]);
  const countOptions = getAvailableQuestionCounts(n);

  return (
    <Screen
      ambience
      width="2xl"
      onEscape={goParent}
      header={
        <ScreenHeader
          title={categoryLabel}
          subtitle={book ? book.title : t('common.unassigned')}
          onBack={goParent}
          width="2xl"
        />
      }
    >
      <section className="mb-6">
        <h2 className="font-study-title text-xl sm:text-2xl font-bold text-text-primary leading-snug break-words">
          {lesson.title}
        </h2>
        {lesson.subtitle && (
          <p className="font-study-title mt-1 text-base text-text-secondary leading-snug break-words">{lesson.subtitle}</p>
        )}
        <p className="mt-2 text-sm text-text-secondary leading-snug">
          {counts.items(lesson.items.length)}
          <span className="text-text-muted"> · </span>
          {t('metrics.accuracyValue', { percent: counts.accuracy(metrics.accuracyPercent) })}
        </p>
      </section>

      <section aria-labelledby="lesson-actions-heading" className="space-y-3">
        <SectionLabel id="lesson-actions-heading">{t('lesson.actions')}</SectionLabel>

        {n === 0 && lesson.items.length > 0 && (
          <InlineNotice tone="warning" icon={<IconAlertTriangle size={18} stroke={2} />}>
            {t('quizConfig.noEligible')}
          </InlineNotice>
        )}

        <ActionCard
          icon={<IconBrain size={22} stroke={1.75} />}
          title={t('lesson.practice')}
          description={t('lesson.practiceDesc')}
          onClick={startPractice}
          disabled={n === 0}
        />

        {/* Quick Test: the card itself is not a button; each count starts a test */}
        <div
          ref={quickTestRef}
          className={`bg-surface border border-border-subtle rounded-xl shadow-clay-card p-4 sm:p-5 ${n === 0 ? 'opacity-60' : ''}`}
        >
          <div className="flex items-start gap-3.5">
            <ActionIcon>
              <IconClock size={22} stroke={1.75} />
            </ActionIcon>
            <div className="min-w-0 flex-1">
              <h3 id="quick-test-heading" className="text-base font-semibold text-text-primary leading-snug">
                {t('lesson.quickTest')}
              </h3>
              <p className="text-sm text-text-secondary leading-snug mt-0.5">{t('lesson.quickTestDesc')}</p>
            </div>
          </div>
          {n > 0 && (
            <div role="group" aria-labelledby="quick-test-heading" className="mt-3.5 flex flex-wrap gap-2 sm:pl-[3.625rem]">
              {countOptions.map((count) => (
                <Button
                  key={count}
                  onClick={() => startQuickTest(count)}
                  aria-label={t('lesson.quickTestCountAria', { count })}
                  className="min-w-[3.5rem]"
                >
                  {count}
                </Button>
              ))}
              <Button
                onClick={() => startQuickTest('all')}
                aria-label={t('lesson.quickTestCountAria', { count: n })}
              >
                {t('quizConfig.all', { count: n })}
              </Button>
            </div>
          )}
        </div>

        <ActionCard
          icon={<IconList size={22} stroke={1.75} />}
          title={t('lesson.viewItems')}
          description={t('lesson.viewItemsDesc', { count: counts.items(lesson.items.length) })}
          onClick={openItems}
        />

        <ActionCard
          icon={<IconRefresh size={22} stroke={1.75} />}
          title={t('lesson.review')}
          description={
            weakItemIds.length > 0
              ? t('metrics.weakCount', { count: weakItemIds.length })
              : t('lesson.reviewNone')
          }
          onClick={startReview}
          emphasis={weakItemIds.length > 0}
        />
      </section>
    </Screen>
  );
};

const ActionIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    aria-hidden="true"
    className="w-11 h-11 rounded-xl bg-primary-surface border border-primary-border text-primary flex items-center justify-center shrink-0"
  >
    {children}
  </span>
);

const ActionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  emphasis?: boolean;
}> = ({ icon, title, description, onClick, disabled = false, emphasis = false }) => {
  const { isPressed, pressHandlers } = usePressFeedback();
  return (
    <button
      type="button"
      disabled={disabled}
      {...(disabled ? {} : pressHandlers)}
      onClick={onClick}
      className={`clay-interactive w-full text-left bg-surface border border-border-subtle rounded-xl p-4 sm:p-5 flex items-center gap-3.5 ${disabled ? 'opacity-60 cursor-not-allowed shadow-clay-pressed' : isPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-card'} ${FOCUS_RING}`}
    >
      <ActionIcon>{icon}</ActionIcon>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-text-primary leading-snug">{title}</span>
        <span className={`block text-sm leading-snug mt-0.5 ${emphasis ? 'text-primary font-semibold' : 'text-text-secondary'}`}>
          {description}
        </span>
      </span>
      <IconChevronRight size={20} stroke={2} aria-hidden="true" className="shrink-0 text-text-muted clay-hover-nudge transition-transform" />
    </button>
  );
};
