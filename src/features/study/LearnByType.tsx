import React from 'react';
import { IconFolderOpen, IconNotebook } from '@tabler/icons-react';
import { StudyCategory } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { useCounts } from '../../hooks/useCounts';
import { countItems, groupLessonsByBook } from '../../lib/studySelectors';
import { Screen, ScreenHeader } from '../../components/Screen';
import { BookThumb, CATEGORY_LABEL_KEYS, InlineNotice, LessonList } from './StudyParts';

/**
 * SCREEN 04 — Learn by Type (`/learn/:category`).
 * All lessons of one category grouped by parent Study Book (library order), always expanded,
 * with the neutral Unassigned group last.
 */
export const LearnByType: React.FC<{ category: StudyCategory }> = ({ category }) => {
  const { state } = useAppState();
  const { navigate, goUp } = useNavigation();
  const { t } = useI18n();
  const counts = useCounts();
  const goHome = () => goUp({ type: 'home' });
  const label = t(CATEGORY_LABEL_KEYS[category]);
  const groups = groupLessonsByBook(state.lessons, state.books, category);

  return (
    <Screen
      ambience
      width="4xl"
      onEscape={goHome}
      header={<ScreenHeader title={t('learn.title', { category: label })} onBack={goHome} width="4xl" />}
    >
      {groups.length === 0 ? (
        <InlineNotice icon={<IconNotebook size={18} stroke={2} />}>{t('learn.empty')}</InlineNotice>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {groups.map((group, index) => {
            const headingId = `learn-group-${index}`;
            const title = group.book ? group.book.title : t('common.unassigned');
            return (
              <section key={group.book?.id ?? 'unassigned'} aria-labelledby={headingId}>
                <div className="flex items-center gap-3 mb-2.5">
                  {group.book ? (
                    <BookThumb book={group.book} className="w-8" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="w-8 aspect-[3/4] rounded-md border border-dashed border-border-strong text-text-muted flex items-center justify-center shrink-0"
                    >
                      <IconFolderOpen size={16} stroke={1.75} />
                    </span>
                  )}
                  <h2 id={headingId} className="min-w-0 flex-1 font-study-title text-base sm:text-lg font-semibold text-text-primary leading-snug break-words">
                    {title}
                  </h2>
                  <span className="shrink-0 text-xs sm:text-sm text-text-muted whitespace-nowrap">
                    {t('metrics.lessonsAndItems', {
                      lessons: counts.lessons(group.lessons.length),
                      items: counts.items(countItems(group.lessons)),
                    })}
                  </span>
                </div>
                <LessonList
                  lessons={group.lessons}
                  progressByItem={state.progressByItem}
                  onOpen={(lesson) => navigate({ type: 'lesson_detail', lessonId: lesson.id })}
                  labelledBy={headingId}
                />
              </section>
            );
          })}
        </div>
      )}
    </Screen>
  );
};
