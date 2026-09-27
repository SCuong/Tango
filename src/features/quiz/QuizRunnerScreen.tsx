import React, { useEffect, useId, useRef, useState } from 'react';
import {
  IconArrowRight,
  IconCheck,
  IconFlame,
  IconHome,
  IconMoodHappy,
  IconX,
} from '@tabler/icons-react';
import { QuestionType, QuizQuestion } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { CLAY_PRESSED_CLASSES, usePressFeedback } from '../../hooks/usePressFeedback';
import {
  QuizAnswerRecord,
  QuizSessionState,
  formatDuration,
  getCurrentQuestion,
  getElapsedSeconds,
} from '../../lib/quizSession';
import { playFeedbackSound } from '../../lib/sound';
import { Button, FOCUS_RING, IconButton } from '../../components/Button';
import { Dialog, dismissModalHistory } from '../../components/Dialog';
import { Screen, ScreenHeader, isDialogOpen } from '../../components/Screen';
import { MeoEdgeAmbience } from '../../components/ThemeAmbience';
import { formatMeanings } from '../study/LessonItems';
import { useQuizSession } from './QuizSessionContext';

/** Correct answers advance automatically after this delay (QUIZ_SESSION_SCREENS SCREEN 11). */
export const CORRECT_AUTO_ADVANCE_MS = 750;

/** Question types whose prompt is Japanese study content. */
const JAPANESE_PROMPT_TYPES: QuestionType[] = ['kana_to_japanese', 'japanese_to_vi'];
/** Question types whose answer options are Japanese study content. */
const JAPANESE_ANSWER_TYPES: QuestionType[] = ['kana_to_japanese', 'vi_to_japanese'];

const ANSWER_POSITION_CLASSES = [
  'bg-answer-1-bg border-answer-1-border text-answer-1-text',
  'bg-answer-2-bg border-answer-2-border text-answer-2-text',
  'bg-answer-3-bg border-answer-3-border text-answer-3-text',
  'bg-answer-4-bg border-answer-4-border text-answer-4-text',
];

/**
 * SCREEN 10 – 13 and SCREEN 15 — the single shared quiz runner (`/quiz/session`, `/quiz/review`).
 * Focused narrow canvas without ambience: HUD, dominant prompt, answers in the thumb zone.
 */
export const QuizRunnerScreen: React.FC<{ review: boolean }> = ({ review }) => {
  const { session } = useQuizSession();
  const { t } = useI18n();
  const { goBack } = useNavigation();

  if (!session) {
    return (
      <QuizMessageScreen
        title={review ? t('review.title') : t('app.name')}
        message={review ? t('review.empty') : t('quiz.noSession')}
        icon={review ? <IconMoodHappy size={24} stroke={1.75} /> : undefined}
        onClose={() => goBack({ type: 'home' })}
      />
    );
  }

  return <ActiveQuiz session={session} />;
};

export const QuizMessageScreen: React.FC<{
  title: string;
  message: string;
  icon?: React.ReactNode;
  onClose: () => void;
}> = ({ title, message, icon, onClose }) => {
  const { t } = useI18n();
  const { navigate } = useNavigation();
  return (
    <Screen width="xl" onEscape={onClose} header={<ScreenHeader title={title} onBack={onClose} width="xl" />}>
      <div className="bg-surface border border-border-subtle rounded-2xl shadow-clay-card p-6 text-center flex flex-col items-center gap-4">
        {icon && (
          <span aria-hidden="true" className="w-12 h-12 rounded-full bg-success-surface text-success-text flex items-center justify-center">
            {icon}
          </span>
        )}
        <p className="text-base text-text-secondary leading-relaxed">{message}</p>
        <Button icon={<IconHome size={18} stroke={2} />} onClick={() => navigate({ type: 'home' })}>
          {t('results.home')}
        </Button>
      </div>
    </Screen>
  );
};

const ActiveQuiz: React.FC<{ session: QuizSessionState }> = ({ session }) => {
  const { state } = useAppState();
  const { answer, advance, discardSession } = useQuizSession();
  const { goUp, goBack, replace, setNavigationBlocker } = useNavigation();
  const { t } = useI18n();
  const [exitOpen, setExitOpen] = useState(false);
  const exitingRef = useRef(false);
  const question = getCurrentQuestion(session);
  const soundEnabled = state.preferences.soundEnabled;

  // Browser Back during an active quiz opens the exit confirmation instead of leaving
  useEffect(() => {
    if (session.status === 'finished') {
      // Reached a finished session again (e.g. browser Forward): show its results
      replace({ type: 'quiz_results' });
      return undefined;
    }
    setNavigationBlocker(() => {
      if (exitingRef.current) return false;
      setExitOpen(true);
      return true;
    });
    return () => setNavigationBlocker(null);
    // Evaluated once when the runner opens
  }, [setNavigationBlocker]);

  // An exited session is discarded when the runner unmounts
  useEffect(
    () => () => {
      if (exitingRef.current) discardSession();
    },
    [discardSession]
  );

  const submit = (userAnswer: string) => {
    const next = answer(userAnswer);
    if (next?.lastAnswer && soundEnabled) {
      playFeedbackSound(next.lastAnswer.isCorrect ? 'correct' : 'incorrect');
    }
  };

  const goNext = () => {
    const result = advance();
    if (result?.completed) {
      exitingRef.current = true;
      setNavigationBlocker(null);
      // Pop an open explanation-sheet history marker before leaving for the results
      void dismissModalHistory().then(() => goUp({ type: 'quiz_results' }));
    }
  };

  const confirmExit = async () => {
    exitingRef.current = true;
    setNavigationBlocker(null);
    await dismissModalHistory();
    setExitOpen(false);
    goBack({ type: 'home' });
  };

  const inFeedback = session.status === 'feedback';
  const lastAnswer = session.lastAnswer;
  const correctFeedback = inFeedback && lastAnswer?.isCorrect === true;
  const incorrectFeedback = inFeedback && lastAnswer?.isCorrect === false;

  // Correct: auto-advance after 750ms (never delayed by sound)
  useEffect(() => {
    if (!correctFeedback || exitOpen) return;
    const timer = setTimeout(goNext, CORRECT_AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // goNext is recreated each render; the timer only depends on the feedback state
  }, [correctFeedback, exitOpen, session.currentIndex]);

  // Keyboard: 1–4 choose, Enter/Space advance after a correct answer, Escape asks to exit
  const keyStateRef = useRef({ question, inFeedback, correctFeedback, submit, goNext });
  keyStateRef.current = { question, inFeedback, correctFeedback, submit, goNext };
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isDialogOpen() || e.altKey || e.ctrlKey || e.metaKey) return;
      const current = keyStateRef.current;
      const target = e.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT';
      if (e.key === 'Escape') {
        e.preventDefault();
        setExitOpen(true);
        return;
      }
      if (current.correctFeedback && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        current.goNext();
        return;
      }
      if (!current.inFeedback && !typing && current.question?.options && /^[1-4]$/.test(e.key)) {
        const option = current.question.options[Number(e.key) - 1];
        if (option !== undefined) {
          e.preventDefault();
          current.submit(option);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!question || session.status === 'finished') return null;

  const total = session.queue.length;
  const position = session.currentIndex + 1;
  const answeredCount = session.currentIndex + (inFeedback ? 1 : 0);
  const japanesePrompt = JAPANESE_PROMPT_TYPES.includes(question.type);

  return (
    <div className="min-h-[100dvh] bg-page text-text-primary flex flex-col">
      {/* Meo's World only, wide screens only: static cats in the outer margins, never behind the prompt or answers */}
      <MeoEdgeAmbience wideOnly />
      {/* Top HUD: exit, progress, counter, streak (and timer in test mode) */}
      <header className="relative w-full pt-[env(safe-area-inset-top)]">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center gap-3">
          <IconButton label={t('quiz.exit')} icon={<IconX size={22} stroke={2} />} onClick={() => setExitOpen(true)} />
          <div className="flex-1 min-w-0">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={answeredCount}
              aria-label={t('quiz.progressAria', { current: position, total })}
              className="h-2.5 rounded-full bg-surface-elevated border border-border-subtle overflow-hidden"
            >
              <div
                className="h-full bg-primary rounded-full transition-[width] duration-300 ease-out"
                style={{ width: `${total > 0 ? (answeredCount / total) * 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-semibold text-text-secondary tabular-nums whitespace-nowrap" aria-hidden="true">
            {position} / {total}
          </span>
          <span
            className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary tabular-nums"
            aria-label={t('quiz.streakAria', { count: session.streak })}
          >
            <IconFlame size={18} stroke={2} aria-hidden="true" className={session.streak > 0 ? 'text-warning' : ''} />
            <span aria-hidden="true">{session.streak}</span>
          </span>
          {session.config.mode === 'test' && <QuizTimer session={session} />}
        </div>
      </header>

      {/* During correct feedback a tap anywhere on the canvas advances */}
      <main
        className="relative flex-1 w-full max-w-xl mx-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col"
        onClick={correctFeedback ? goNext : undefined}
      >
        {/* Prompt stage: dominant upper half */}
        <section className="flex-1 min-h-[180px] flex flex-col items-center justify-center text-center py-6 relative">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">
            {t(`quiz.instruction.${question.type}`)}
          </p>
          <h1
            lang={japanesePrompt ? 'ja' : undefined}
            className={`${japanesePrompt ? 'font-japanese' : 'font-sans'} font-bold text-text-primary text-[1.875rem] sm:text-[2.5rem] leading-tight break-words max-w-full`}
          >
            {question.prompt}
          </h1>
          {question.subPrompt && (
            <p lang="ja" className="font-japanese mt-2 text-base text-text-secondary">
              {question.subPrompt}
            </p>
          )}
          <div className="h-12 mt-4 flex items-center justify-center" aria-live="polite">
            {correctFeedback && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 rounded-full bg-success-surface text-success-text border border-success px-4 py-1.5 text-sm font-semibold"
              >
                <IconCheck size={18} stroke={2.5} aria-hidden="true" />
                {t('quiz.correct')}
              </span>
            )}
          </div>
        </section>

        {/* Answer stage: thumb zone */}
        <section className="pb-2">
          {question.options ? (
            <div className="grid gap-3">
              {question.options.map((option, index) => (
                <AnswerOption
                  key={`${question.id}-${index}`}
                  index={index}
                  text={option}
                  japanese={JAPANESE_ANSWER_TYPES.includes(question.type)}
                  state={optionState(option, question, lastAnswer, inFeedback)}
                  disabled={inFeedback}
                  onSelect={() => submit(option)}
                />
              ))}
            </div>
          ) : (
            <WrittenAnswer
              key={question.id}
              inFeedback={inFeedback}
              lastAnswer={lastAnswer}
              onSubmit={submit}
            />
          )}
        </section>
      </main>

      <ExplanationSheet
        open={incorrectFeedback && !exitOpen && !exitingRef.current}
        question={question}
        lastAnswer={lastAnswer}
        onContinue={goNext}
        onDismiss={() => setExitOpen(true)}
      />

      <ExitDialog open={exitOpen} onKeep={() => setExitOpen(false)} onExit={confirmExit} />
    </div>
  );
};

type OptionVisualState = 'idle' | 'correct' | 'wrong' | 'reveal' | 'muted';

function optionState(
  option: string,
  question: QuizQuestion,
  lastAnswer: QuizAnswerRecord | null,
  inFeedback: boolean
): OptionVisualState {
  if (!inFeedback || !lastAnswer) return 'idle';
  if (option === lastAnswer.userAnswer) return lastAnswer.isCorrect ? 'correct' : 'wrong';
  if (!lastAnswer.isCorrect && option === question.correctAnswer) return 'reveal';
  return 'muted';
}

const AnswerOption: React.FC<{
  index: number;
  text: string;
  japanese: boolean;
  state: OptionVisualState;
  disabled: boolean;
  onSelect: () => void;
}> = ({ index, text, japanese, state, disabled, onSelect }) => {
  const { t } = useI18n();
  const { isPressed, pressHandlers } = usePressFeedback();
  const ring =
    state === 'correct' || state === 'reveal'
      ? 'ring-[3px] ring-success'
      : state === 'wrong'
        ? 'ring-[3px] ring-error'
        : '';
  return (
    <button
      type="button"
      {...(disabled ? {} : pressHandlers)}
      aria-disabled={disabled || undefined}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onSelect();
      }}
      aria-label={t('quiz.optionAria', { answer: text })}
      className={`clay-interactive relative w-full min-h-answer sm:min-h-[58px] px-12 py-3 rounded-xl border text-center ${ANSWER_POSITION_CLASSES[index]} ${!disabled && isPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-card'} ${ring} ${state === 'muted' ? 'opacity-60' : ''} ${disabled ? 'cursor-default' : ''} ${FOCUS_RING}`}
    >
      <span
        lang={japanese ? 'ja' : undefined}
        className={`${japanese ? 'font-japanese text-xl sm:text-[1.375rem]' : 'text-lg sm:text-xl'} font-semibold leading-snug break-words`}
      >
        {text}
      </span>
      {(state === 'correct' || state === 'reveal') && (
        <IconCheck size={22} stroke={2.75} aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-success" />
      )}
      {state === 'wrong' && (
        <IconX size={22} stroke={2.75} aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-error" />
      )}
    </button>
  );
};

const WrittenAnswer: React.FC<{
  inFeedback: boolean;
  lastAnswer: QuizAnswerRecord | null;
  onSubmit: (value: string) => void;
}> = ({ inFeedback, lastAnswer, onSubmit }) => {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const ring =
    inFeedback && lastAnswer
      ? lastAnswer.isCorrect
        ? 'ring-[3px] ring-success border-success'
        : 'ring-[3px] ring-error border-error'
      : 'border-border-strong';
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!inFeedback && value.trim() !== '') onSubmit(value);
      }}
      className="space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <label htmlFor={inputId} className="sr-only">
        {t('quiz.answerLabel')}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        lang="ja"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        readOnly={inFeedback}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={t('quiz.answerPlaceholder')}
        className={`w-full min-h-answer rounded-xl bg-surface border px-4 text-center font-japanese text-xl text-text-primary placeholder:text-text-muted placeholder:font-sans placeholder:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${ring}`}
      />
      {!inFeedback && (
        <Button type="submit" variant="primary" size="lg" fullWidth disabled={value.trim() === ''}>
          {t('quiz.check')}
        </Button>
      )}
    </form>
  );
};

const QuizTimer: React.FC<{ session: QuizSessionState }> = ({ session }) => {
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const time = formatDuration(getElapsedSeconds(session, now));
  return (
    <span
      className="text-sm font-semibold text-text-secondary tabular-nums"
      aria-label={t('quiz.timerAria', { time })}
    >
      {time}
    </span>
  );
};

/** SCREEN 12 — explanation: bottom sheet on mobile, centered card from `sm` up. */
const ExplanationSheet: React.FC<{
  open: boolean;
  question: QuizQuestion;
  lastAnswer: QuizAnswerRecord | null;
  onContinue: () => void;
  /** Escape / browser Back: ask to exit instead of silently skipping ahead (SCREEN 13). */
  onDismiss: () => void;
}> = ({ open, question, lastAnswer, onContinue, onDismiss }) => {
  const { t } = useI18n();
  const titleId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);
  const item = question.targetItem;
  const kana = item.kana?.trim();
  const hanViet = item.hanViet?.trim();
  const meanings = formatMeanings(item);
  return (
    <Dialog
      open={open}
      onClose={onDismiss}
      labelledBy={titleId}
      initialFocusRef={continueRef}
      presentation="sheet"
      dismissOnBackdrop={false}
    >
      <p id={titleId} className="inline-flex items-center gap-2 text-base font-bold text-error-text">
        <IconX size={20} stroke={2.5} aria-hidden="true" />
        {t('quiz.incorrect')}
      </p>
      <div className="mt-4">
        <p lang="ja" className="font-japanese text-3xl font-bold text-text-primary leading-tight break-words">
          {item.japanese}
        </p>
        {kana && (
          <p lang="ja" className="font-japanese mt-1 text-lg text-text-secondary">
            {kana}
          </p>
        )}
      </div>
      <dl className="mt-4 space-y-2 text-[15px] leading-relaxed">
        {hanViet && (
          <div className="flex gap-2">
            <dt className="text-text-muted shrink-0">{t('items.hanViet')}:</dt>
            <dd className="font-semibold uppercase tracking-wide text-text-primary">{hanViet}</dd>
          </div>
        )}
        {meanings && (
          <div className="flex gap-2">
            <dt className="text-text-muted shrink-0">{t('items.meaning')}:</dt>
            <dd className="text-text-primary break-words">{meanings}</dd>
          </div>
        )}
        {lastAnswer && question.type === 'vi_to_text' && (
          <div className="flex gap-2">
            <dd className="text-text-secondary break-words">{t('quiz.yourAnswer', { answer: lastAnswer.userAnswer })}</dd>
          </div>
        )}
      </dl>
      <Button
        ref={continueRef}
        variant="primary"
        size="lg"
        fullWidth
        className="mt-6"
        trailingIcon={<IconArrowRight size={20} stroke={2} />}
        onClick={onContinue}
      >
        {t('quiz.continueAfterMistake')}
      </Button>
    </Dialog>
  );
};

/** SCREEN 13 — exit confirmation: "Keep studying" holds initial focus. */
const ExitDialog: React.FC<{ open: boolean; onKeep: () => void; onExit: () => void }> = ({
  open,
  onKeep,
  onExit,
}) => {
  const { t } = useI18n();
  const titleId = useId();
  const bodyId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog open={open} onClose={onKeep} labelledBy={titleId} describedBy={bodyId} initialFocusRef={keepRef}>
      <h2 id={titleId} className="text-lg font-bold text-text-primary leading-snug">
        {t('quiz.exitDialog.title')}
      </h2>
      <p id={bodyId} className="mt-3 text-[15px] text-text-secondary leading-relaxed">
        {t('quiz.exitDialog.body')}
      </p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onExit} className="sm:min-w-[7rem]">
          {t('quiz.exitDialog.exit')}
        </Button>
        <Button ref={keepRef} variant="primary" onClick={onKeep} className="sm:min-w-[9rem]">
          {t('quiz.exitDialog.keep')}
        </Button>
      </div>
    </Dialog>
  );
};
