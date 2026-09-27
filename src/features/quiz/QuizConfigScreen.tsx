import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IconAlertTriangle, IconChevronDown, IconPlayerPlay } from '@tabler/icons-react';
import { Lesson, QuestionType, StudyBook, StudyCategory } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { useCounts } from '../../hooks/useCounts';
import { getAvailableQuestionCounts, getQuizEligibility } from '../../lib/quizEngine';
import { ALL_QUESTION_TYPES, DEFAULT_QUESTION_TYPES } from '../../lib/quizSession';
import { STUDY_CATEGORIES, getBookLessons, groupLessonsByBook } from '../../lib/studySelectors';
import { AppRoute } from '../../lib/routes';
import { Screen, ScreenHeader, SectionLabel, StickyBottomBar, isDialogOpen } from '../../components/Screen';
import { Button, FOCUS_RING } from '../../components/Button';
import { CheckboxRow } from '../../components/FormControls';
import { NotFoundScreen } from '../../components/NotFoundScreen';
import { BookThumb, CATEGORY_GLYPHS, CATEGORY_LABEL_KEYS, InlineNotice } from '../study/StudyParts';
import { useStartQuiz } from './useStartQuiz';

export type QuizConfigScope =
  | { kind: 'category'; bookId: string; category: StudyCategory }
  | { kind: 'book'; bookId: string }
  | { kind: 'mixed' };

interface LessonSection {
  key: string;
  title: string;
  book?: StudyBook | null;
  subsections: { key: string; category: StudyCategory; lessons: Lesson[] }[];
}

/**
 * SCREEN 07 / 08 / 09 — Category, Book, and Global Mixed test configuration.
 * One component for all three scopes; all of them only produce `lessonIds: string[]` for the
 * shared quiz engine and show the canonical N / count / N = 0 rules (QUIZ_CONFIG_SCREENS).
 */
export const QuizConfigScreen: React.FC<{ scope: QuizConfigScope }> = ({ scope }) => {
  const { state } = useAppState();
  const { goUp } = useNavigation();
  const { t } = useI18n();
  const counts = useCounts();
  const startQuiz = useStartQuiz();

  const book = scope.kind === 'mixed' ? undefined : state.books[scope.bookId];
  const scopeKey = JSON.stringify(scope);

  // Sections of selectable lessons for this scope (library order)
  const sections: LessonSection[] = useMemo(() => {
    if (scope.kind === 'category') {
      return [
        {
          key: 'category',
          title: '',
          subsections: [
            { key: scope.category, category: scope.category, lessons: getBookLessons(state.lessons, scope.bookId, scope.category) },
          ],
        },
      ];
    }
    if (scope.kind === 'book') {
      return STUDY_CATEGORIES.map((category) => ({
        key: category,
        title: t(CATEGORY_LABEL_KEYS[category]),
        subsections: [{ key: category, category, lessons: getBookLessons(state.lessons, scope.bookId, category) }],
      })).filter((section) => section.subsections[0].lessons.length > 0);
    }
    return groupLessonsByBook(state.lessons, state.books).map((group) => ({
      key: group.book?.id ?? 'unassigned',
      title: group.book ? group.book.title : t('common.unassigned'),
      book: group.book,
      subsections: STUDY_CATEGORIES.map((category) => ({
        key: `${group.book?.id ?? 'unassigned'}-${category}`,
        category,
        lessons: group.lessons.filter((lesson) => lesson.category === category),
      })).filter((sub) => sub.lessons.length > 0),
    }));
    // The scope object is recreated by the router on every render; its JSON is the stable identity
  }, [scopeKey, state.lessons, state.books, t]);

  const allLessonIds = useMemo(
    () => sections.flatMap((section) => section.subsections.flatMap((sub) => sub.lessons.map((l) => l.id))),
    [sections]
  );

  // Category and book tests start with every lesson checked; the global mixed test starts empty
  const [selected, setSelected] = useState<string[]>(() => (scope.kind === 'mixed' ? [] : allLessonIds));
  const [types, setTypes] = useState<QuestionType[]>(DEFAULT_QUESTION_TYPES);
  const [count, setCount] = useState<number | 'all'>(10);

  // Keep selection in library order and drop lessons that no longer exist
  const selectedIds = useMemo(
    () => allLessonIds.filter((id) => selected.includes(id)),
    [allLessonIds, selected]
  );
  const eligibility = useMemo(
    () => getQuizEligibility(selectedIds, state.lessons, types),
    [selectedIds, state.lessons, types]
  );
  const n = eligibility.eligibleCount;
  const countOptions = getAvailableQuestionCounts(n);
  const effectiveCount: number | 'all' =
    count === 'all' || countOptions.includes(count) ? count : countOptions.length > 0 ? countOptions[0] : 'all';

  const parentRoute: AppRoute =
    scope.kind === 'category'
      ? { type: 'category_inside_book', bookId: scope.bookId, category: scope.category }
      : scope.kind === 'book'
        ? { type: 'book_study', bookId: scope.bookId }
        : { type: 'home' };
  const goParent = () => goUp(parentRoute);

  const start = () => {
    if (n === 0) return;
    startQuiz({
      lessonIds: selectedIds,
      mode: 'test',
      questionCount: effectiveCount,
      allowedTypes: ALL_QUESTION_TYPES.filter((type) => types.includes(type)),
      kind: 'standard',
    });
  };

  // Enter starts the test when focus is not on another control (SCREEN_SPEC keyboard matrix)
  const startRef = useRef(start);
  startRef.current = start;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || isDialogOpen()) return;
      const target = e.target as HTMLElement | null;
      if (target && target !== document.body) return;
      e.preventDefault();
      startRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (scope.kind !== 'mixed' && !book) {
    return <NotFoundScreen message={t('common.notFound.book')} onBack={() => goUp({ type: 'home' })} />;
  }

  const title =
    scope.kind === 'category'
      ? t('quizConfig.categoryTitle', { category: t(CATEGORY_LABEL_KEYS[scope.category]) })
      : scope.kind === 'book'
        ? t('quizConfig.bookTitle')
        : t('quizConfig.mixedTitle');

  const toggle = (ids: string[], on: boolean) =>
    setSelected((current) => (on ? Array.from(new Set([...current, ...ids])) : current.filter((id) => !ids.includes(id))));

  const allSelected = allLessonIds.length > 0 && selectedIds.length === allLessonIds.length;
  const width = scope.kind === 'category' ? '2xl' : scope.kind === 'book' ? '3xl' : '4xl';

  const startButton = (
    <Button
      variant="primary"
      size="lg"
      fullWidth
      icon={<IconPlayerPlay size={20} stroke={2} />}
      disabled={n === 0}
      onClick={start}
    >
      {t('quizConfig.start')}
    </Button>
  );

  const settingsPanel = (
    <div className="space-y-5">
      <p className="text-sm font-semibold text-text-primary leading-relaxed" aria-live="polite">
        {t('quizConfig.tally', { selected: eligibility.rawItemCount, eligible: n })}
      </p>

      {n === 0 ? (
        <InlineNotice tone="warning" icon={<IconAlertTriangle size={18} stroke={2} />}>
          {t('quizConfig.noEligible')}
        </InlineNotice>
      ) : (
        <div>
          <SectionLabel id="quiz-count-heading" className="mb-2">
            {t('quizConfig.count')}
          </SectionLabel>
          <div
            role="radiogroup"
            aria-labelledby="quiz-count-heading"
            className="flex flex-wrap gap-2"
            onKeyDown={(e) => {
              const options: (number | 'all')[] = [...countOptions, 'all'];
              const index = options.indexOf(effectiveCount);
              let next = -1;
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % options.length;
              if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
              if (next < 0) return;
              e.preventDefault();
              setCount(options[next]);
              const chips = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
              chips[next]?.focus();
            }}
          >
            {countOptions.map((option) => (
              <CountChip key={option} selected={effectiveCount === option} onSelect={() => setCount(option)}>
                {option}
              </CountChip>
            ))}
            <CountChip selected={effectiveCount === 'all'} onSelect={() => setCount('all')}>
              {t('quizConfig.all', { count: n })}
            </CountChip>
          </div>
        </div>
      )}

      <div>
        <SectionLabel id="quiz-types-heading" className="mb-1">
          {t('quizConfig.types')}
        </SectionLabel>
        <div role="group" aria-labelledby="quiz-types-heading" className="-mx-3">
          {ALL_QUESTION_TYPES.map((type) => (
            <CheckboxRow
              key={type}
              checked={types.includes(type)}
              onChange={(on) => setTypes((current) => (on ? [...current, type] : current.filter((x) => x !== type)))}
              label={t(`quizType.${type}`)}
            />
          ))}
        </div>
      </div>

      <div className="hidden sm:block pt-1">{startButton}</div>
    </div>
  );

  const lessonPicker =
    allLessonIds.length === 0 ? (
      <InlineNotice>{t(scope.kind === 'mixed' ? 'quizConfig.mixedEmpty' : 'quizConfig.noLessonsInScope')}</InlineNotice>
    ) : (
      <section aria-labelledby="quiz-lessons-heading">
        <div className="flex items-center justify-between gap-3 mb-2">
          <SectionLabel id="quiz-lessons-heading">{t('quizConfig.selectLessons')}</SectionLabel>
          <button
            type="button"
            onClick={() => toggle(allLessonIds, !allSelected)}
            className={`min-h-touch px-2 rounded-lg text-sm font-semibold text-primary ${FOCUS_RING}`}
          >
            {allSelected ? t('quizConfig.clearAll') : t('quizConfig.selectAll')}
          </button>
        </div>
        <div className={scope.kind === 'book' ? 'grid gap-3 sm:grid-cols-2 sm:gap-4 sm:items-start' : 'space-y-3'}>
          {sections.map((section) => (
            <LessonGroupCard
              key={section.key}
              section={section}
              scope={scope.kind}
              selected={selectedIds}
              onToggle={toggle}
              itemsLabel={counts.items}
            />
          ))}
        </div>
      </section>
    );

  return (
    <Screen
      ambience
      width={width}
      onEscape={goParent}
      header={
        <ScreenHeader
          title={title}
          subtitle={book ? book.title : undefined}
          onBack={goParent}
          width={width}
          backOnDesktopOnly={scope.kind === 'mixed'}
        />
      }
      bottomBar={
        <StickyBottomBar width={width} mobileOnly>
          {startButton}
        </StickyBottomBar>
      }
    >
      {scope.kind === 'mixed' ? (
        <div className="grid gap-6 sm:grid-cols-[3fr_2fr] sm:items-start">
          <div>{lessonPicker}</div>
          <aside
            aria-label={t('quizConfig.settings')}
            className="bg-surface border border-border-subtle rounded-2xl shadow-clay-card p-4 sm:p-5 sm:sticky sm:top-20"
          >
            {settingsPanel}
          </aside>
        </div>
      ) : (
        <div className="space-y-6">
          {lessonPicker}
          <section
            aria-label={t('quizConfig.settings')}
            className="bg-surface border border-border-subtle rounded-2xl shadow-clay-card p-4 sm:p-5"
          >
            {settingsPanel}
          </section>
        </div>
      )}
    </Screen>
  );
};

const CountChip: React.FC<{ selected: boolean; onSelect: () => void; children: React.ReactNode }> = ({
  selected,
  onSelect,
  children,
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    tabIndex={selected ? 0 : -1}
    onClick={onSelect}
    className={`min-h-touch min-w-[3.5rem] px-4 rounded-full border text-sm font-semibold transition-colors ${
      selected
        ? 'bg-primary-surface border-primary text-text-primary ring-1 ring-primary'
        : 'bg-surface border-border-strong text-text-secondary'
    } ${FOCUS_RING}`}
  >
    {children}
  </button>
);

const LessonGroupCard: React.FC<{
  section: LessonSection;
  scope: QuizConfigScope['kind'];
  selected: string[];
  onToggle: (ids: string[], on: boolean) => void;
  itemsLabel: (count: number) => string;
}> = ({ section, scope, selected, onToggle, itemsLabel }) => {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);
  const collapsible = scope !== 'category';
  const panelId = `quiz-group-${section.key}`;
  const ids = section.subsections.flatMap((sub) => sub.lessons.map((l) => l.id));
  const selectedCount = ids.filter((id) => selected.includes(id)).length;

  return (
    <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
      {collapsible && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((value) => !value)}
          className={`flat-interactive w-full min-h-touch px-4 py-2.5 flex items-center gap-3 text-left border-b border-border-subtle ${FOCUS_RING} focus-visible:ring-inset focus-visible:ring-offset-0`}
        >
          {scope === 'mixed' && section.book && <BookThumb book={section.book} className="w-7" />}
          {scope === 'book' && section.subsections[0] && (
            <span lang="ja" aria-hidden="true" className="font-japanese font-bold text-base text-text-secondary whitespace-nowrap">
              {CATEGORY_GLYPHS[section.subsections[0].category]}
            </span>
          )}
          <span className="flex-1 min-w-0 font-study-title font-semibold text-text-primary leading-snug break-words">
            {section.title}
          </span>
          <span className="shrink-0 text-xs text-text-muted tabular-nums">
            {selectedCount}/{ids.length}
          </span>
          <IconChevronDown
            size={18}
            stroke={2}
            aria-hidden="true"
            className={`shrink-0 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
      {expanded && (
        <div id={panelId} className="px-1 py-1">
          {section.subsections.map((sub) => (
            <div key={sub.key}>
              {scope === 'mixed' && (
                <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t(CATEGORY_LABEL_KEYS[sub.category])}
                </p>
              )}
              {sub.lessons.map((lesson) => (
                <CheckboxRow
                  key={lesson.id}
                  checked={selected.includes(lesson.id)}
                  onChange={(on) => onToggle([lesson.id], on)}
                  label={lesson.subtitle ? `${lesson.title}: ${lesson.subtitle}` : lesson.title}
                  meta={itemsLabel(lesson.items.length)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
