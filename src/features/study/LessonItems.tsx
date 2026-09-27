import React from 'react';
import { IconNotebook } from '@tabler/icons-react';
import { StudyItem } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { useCounts } from '../../hooks/useCounts';
import { Screen, ScreenHeader } from '../../components/Screen';
import { NotFoundScreen } from '../../components/NotFoundScreen';
import { InlineNotice } from './StudyParts';

/** Non-empty Vietnamese meanings joined for display (the full `vietnamese[]` array). */
export function formatMeanings(item: StudyItem): string {
  return item.vietnamese
    .map((meaning) => meaning.trim())
    .filter((meaning) => meaning !== '')
    .join(', ');
}

/**
 * SCREEN 06 — View Lesson Items (`/lesson/:lessonId/items`).
 * Calm reference list: stacked cards on mobile, table-like aligned rows from `sm` up.
 * The Hán Việt tag is omitted entirely when absent (no placeholder).
 */
export const LessonItems: React.FC<{ lessonId: string }> = ({ lessonId }) => {
  const { state } = useAppState();
  const { goUp } = useNavigation();
  const { t } = useI18n();
  const counts = useCounts();
  const lesson = state.lessons[lessonId];
  const goToLesson = () => goUp({ type: 'lesson_detail', lessonId });

  if (!lesson) {
    return <NotFoundScreen message={t('common.notFound.lesson')} onBack={() => goUp({ type: 'home' })} />;
  }

  return (
    <Screen
      width="3xl"
      onEscape={goToLesson}
      header={
        <ScreenHeader
          title={`${t('items.title')} (${counts.items(lesson.items.length)})`}
          subtitle={lesson.title}
          onBack={goToLesson}
          width="3xl"
        />
      }
    >
      {lesson.items.length === 0 ? (
        <InlineNotice icon={<IconNotebook size={18} stroke={2} />}>{t('items.empty')}</InlineNotice>
      ) : (
        <ol className="space-y-3 sm:space-y-0 sm:bg-surface sm:border sm:border-border-subtle sm:rounded-xl sm:overflow-hidden sm:divide-y sm:divide-border-subtle">
          {lesson.items.map((item, index) => (
            <ItemRow key={item.id} item={item} index={index + 1} />
          ))}
        </ol>
      )}
    </Screen>
  );
};

const ItemRow: React.FC<{ item: StudyItem; index: number }> = ({ item, index }) => {
  const { t } = useI18n();
  const meanings = formatMeanings(item);
  const kana = item.kana?.trim();
  const hanViet = item.hanViet?.trim();
  return (
    <li className="bg-surface border border-border-subtle rounded-xl p-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-5 sm:py-3.5 sm:grid sm:grid-cols-[2rem_minmax(0,1.3fr)_minmax(0,1.9fr)] sm:gap-4 sm:items-baseline">
      <span className="hidden sm:block text-xs font-semibold text-text-muted tabular-nums">{index}</span>
      <div className="flex items-start justify-between gap-3 sm:block min-w-0">
        <div className="min-w-0">
          <p lang="ja" className="font-japanese text-2xl sm:text-[1.375rem] font-bold text-text-primary leading-snug break-words">
            {item.japanese}
          </p>
          {kana && (
            <p lang="ja" className="font-japanese text-base text-text-secondary leading-snug mt-0.5 break-words">
              {kana}
            </p>
          )}
        </div>
        {hanViet && (
          <span className="sm:hidden shrink-0 mt-1 inline-flex items-center rounded-sm border border-border-strong bg-surface-elevated px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-text-secondary leading-relaxed">
            <span className="sr-only">{t('items.hanViet')}: </span>
            {hanViet}
          </span>
        )}
      </div>
      <div className="mt-2 sm:mt-0 min-w-0">
        {hanViet && (
          <span className="hidden sm:inline-flex mb-1 items-center rounded-sm border border-border-strong bg-surface-elevated px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-text-secondary leading-relaxed">
            <span className="sr-only">{t('items.hanViet')}: </span>
            {hanViet}
          </span>
        )}
        {meanings && (
          <p className="text-[15px] text-text-primary leading-relaxed break-words">
            <span className="sr-only">{t('items.meaning')}: </span>
            {meanings}
          </p>
        )}
      </div>
    </li>
  );
};
