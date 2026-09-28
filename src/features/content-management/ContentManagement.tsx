import React from 'react';
import { IconBooks, IconChevronRight, IconFileImport, IconPlus } from '@tabler/icons-react';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { useCounts } from '../../hooks/useCounts';
import { CLAY_PRESSED_CLASSES, usePressFeedback } from '../../hooks/usePressFeedback';
import { getBookStudyMetrics } from '../../lib/studyMetrics';
import { getUnassignedLessons } from '../../lib/studySelectors';
import { Screen, ScreenHeader, SectionLabel } from '../../components/Screen';
import { Button, FOCUS_RING } from '../../components/Button';
import { BookThumb, InlineNotice } from '../study/StudyParts';
import { ManagedLessonRow } from './ContentParts';

/**
 * SCREEN 17 — Content Management (`/settings/content-management`).
 * The only place where structural content is added, edited, imported, or deleted.
 * Assigned lessons are managed through their book; unassigned lessons get their own section.
 */
export const ContentManagement: React.FC = () => {
  const { state } = useAppState();
  const { navigate, goUp } = useNavigation();
  const { t } = useI18n();
  const counts = useCounts();
  const goToSettings = () => goUp({ type: 'settings' });
  const books = Object.values(state.books);
  const unassigned = getUnassignedLessons(state.lessons, state.books);

  return (
    <Screen
      width="4xl"
      onEscape={goToSettings}
      header={<ScreenHeader title={t('nav.contentManagement')} onBack={goToSettings} width="4xl" />}
    >
      <div className="grid gap-8 sm:grid-cols-[3fr_2fr] sm:gap-6 sm:items-start">
        <section aria-labelledby="cm-books-heading" className="space-y-3">
          <SectionLabel id="cm-books-heading">{t('content.books')}</SectionLabel>
          {books.length === 0 ? (
            <InlineNotice icon={<IconBooks size={18} stroke={2} />}>{t('content.noBooks')}</InlineNotice>
          ) : (
            <ul className="bg-surface border border-border-subtle rounded-xl divide-y divide-border-subtle overflow-hidden">
              {books.map((book) => {
                const metrics = getBookStudyMetrics(book.id, state.lessons, state.progressByItem);
                return (
                  <li key={book.id} className="px-4 py-3 flex items-center gap-3">
                    <BookThumb book={book} className="w-10" />
                    <div className="flex-1 min-w-0">
                      <p className="font-study-title font-semibold text-text-primary leading-snug break-words line-clamp-2" title={book.title}>
                        {book.title}
                      </p>
                      <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                        {t('metrics.lessonsAndItems', {
                          lessons: counts.lessons(metrics.lessonCount),
                          items: counts.items(metrics.itemCount),
                        })}
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate({ type: 'manage_book', bookId: book.id })}
                      aria-label={t('content.manageAria', { title: book.title })}
                      className="shrink-0"
                    >
                      {t('content.manage')}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          {/* Label first, then a round "+" puck (same affordance as the Home Test CTA) */}
          <Button
            onClick={() => navigate({ type: 'add_book' })}
            className="pr-2.5"
            trailingIcon={
              <span className="tango-icon-puck w-8 h-8 rounded-full bg-primary-surface border border-primary-border text-primary flex items-center justify-center">
                <IconPlus size={18} stroke={2.25} />
              </span>
            }
          >
            {t('content.addBook')}
          </Button>
        </section>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="cm-lessons-heading" className="space-y-3 order-2 sm:order-1">
            <SectionLabel id="cm-lessons-heading">{t('content.lessonTools')}</SectionLabel>
            <ImportCard onOpen={() => navigate({ type: 'import' })} />
          </section>

          {unassigned.length > 0 && (
            <section aria-labelledby="cm-unassigned-heading" className="space-y-3 order-1 sm:order-2">
              <SectionLabel id="cm-unassigned-heading">{t('common.unassigned')}</SectionLabel>
              <ul className="bg-surface border border-border-subtle rounded-xl divide-y divide-border-subtle overflow-hidden">
                {unassigned.map((lesson) => (
                  <ManagedLessonRow
                    key={lesson.id}
                    lesson={lesson}
                    onManage={() => navigate({ type: 'manage_lesson', lessonId: lesson.id })}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </Screen>
  );
};

const ImportCard: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  const { t } = useI18n();
  const { isPressed, pressHandlers } = usePressFeedback();
  return (
    <button
      type="button"
      {...pressHandlers}
      onClick={onOpen}
      className={`clay-interactive w-full text-left bg-surface border border-border-subtle rounded-xl p-4 flex items-center gap-3.5 ${isPressed ? CLAY_PRESSED_CLASSES : 'shadow-clay-card'} ${FOCUS_RING}`}
    >
      <span aria-hidden="true" className="tango-icon-puck w-11 h-11 rounded-xl bg-primary-surface border border-primary-border text-primary flex items-center justify-center shrink-0">
        <IconFileImport size={22} stroke={1.75} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-text-primary leading-snug">{t('content.import')}</span>
      </span>
      <IconChevronRight size={20} stroke={2} aria-hidden="true" className="shrink-0 text-text-muted clay-hover-nudge transition-transform" />
    </button>
  );
};
