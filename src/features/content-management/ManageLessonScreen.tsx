import React, { useState } from 'react';
import { IconBook, IconDeviceFloppy, IconWriting } from '@tabler/icons-react';
import { StudyCategory } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { useCounts } from '../../hooks/useCounts';
import { deleteLessonCascade, isValidTitle, normalizeTitle, updateLessonMetadata } from '../../lib/contentActions';
import { AppRoute } from '../../lib/routes';
import { Screen, ScreenHeader, SectionLabel } from '../../components/Screen';
import { Button } from '../../components/Button';
import { SegmentedControl, SelectField, TextField } from '../../components/FormControls';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { dismissModalHistory } from '../../components/Dialog';
import { NotFoundScreen } from '../../components/NotFoundScreen';
import { formatMeanings } from '../study/LessonItems';
import { CATEGORY_LABEL_KEYS } from '../study/StudyParts';
import { useQuizSession } from '../quiz/QuizSessionContext';
import { DangerZone } from './ContentParts';

const UNASSIGNED_VALUE = '';

/**
 * SCREEN 20 — Manage Lesson (`/settings/content-management/lesson/:lessonId`).
 * Rename, category switch, parent book reassignment (metadata only; IDs and progress are kept),
 * explicit save, item inspection, and the lesson Danger Zone (SCREEN 26 dialog).
 */
export const ManageLessonScreen: React.FC<{ lessonId: string }> = ({ lessonId }) => {
  const { state, commitStudyData, reloadState } = useAppState();
  const { goBack, goUp } = useNavigation();
  const { clearLessonReferences } = useQuizSession();
  const { t } = useI18n();
  const counts = useCounts();
  const lesson = state.lessons[lessonId];
  const initialBookId = lesson?.bookId && state.books[lesson.bookId] ? lesson.bookId : UNASSIGNED_VALUE;
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [subtitle, setSubtitle] = useState(lesson?.subtitle ?? '');
  const [category, setCategory] = useState<StudyCategory>(lesson?.category ?? 'vocabulary');
  const [bookId, setBookId] = useState(initialBookId);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const parentRoute: AppRoute = initialBookId
    ? { type: 'manage_book', bookId: initialBookId }
    : { type: 'content_management' };
  const goParent = () => goBack(parentRoute);

  if (!lesson) {
    return <NotFoundScreen message={t('common.notFound.lesson')} onBack={() => goUp({ type: 'content_management' })} />;
  }

  const titleValid = isValidTitle(title);
  const dirty =
    normalizeTitle(title) !== lesson.title ||
    normalizeTitle(subtitle) !== (lesson.subtitle ?? '') ||
    category !== lesson.category ||
    bookId !== initialBookId;

  const save = () => {
    if (!titleValid || !dirty) return;
    try {
      const updated = updateLessonMetadata(lesson, {
        title,
        subtitle,
        category,
        bookId: bookId || undefined,
      });
      commitStudyData({ lessons: { ...state.lessons, [lesson.id]: updated } });
      setTitle(updated.title);
      setSubtitle(updated.subtitle ?? '');
      setStatus('saved');
    } catch (error) {
      console.error('Failed to save lesson:', error);
      setStatus('error');
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    const destination: AppRoute = lesson.bookId && state.books[lesson.bookId]
      ? { type: 'manage_book', bookId: lesson.bookId }
      : { type: 'content_management' };
    try {
      deleteLessonCascade(lesson.id, (scope) => clearLessonReferences([scope.targetLessonId]));
      await dismissModalHistory();
      reloadState();
      goUp(destination);
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      setDeleteError(t('dialog.deleteError'));
      setDeleteBusy(false);
    }
  };

  const parentBook = lesson.bookId ? state.books[lesson.bookId] : undefined;
  const bookOptions = [
    ...Object.values(state.books).map((book) => ({ value: book.id, label: book.title })),
    { value: UNASSIGNED_VALUE, label: t('common.unassigned') },
  ];

  return (
    <Screen
      width="2xl"
      onEscape={goParent}
      header={
        <ScreenHeader title={t('manageLesson.title')} subtitle={lesson.title} onBack={goParent} width="2xl" />
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="bg-surface border border-border-subtle rounded-2xl p-4 sm:p-6 space-y-5"
        noValidate
      >
        <TextField
          id="manage-lesson-title"
          label={t('lessonForm.title')}
          required
          value={title}
          onChange={(value) => {
            setTitle(value);
            setStatus('idle');
          }}
          error={!titleValid ? t('lessonForm.titleRequired') : undefined}
          maxLength={200}
        />
        <TextField
          id="manage-lesson-subtitle"
          label={t('lessonForm.subtitle')}
          value={subtitle}
          onChange={(value) => {
            setSubtitle(value);
            setStatus('idle');
          }}
          maxLength={200}
        />
        <div>
          <p id="manage-lesson-category" className="text-sm font-semibold text-text-primary mb-1.5">
            {t('lessonForm.category')}
          </p>
          <SegmentedControl
            labelledBy="manage-lesson-category"
            value={category}
            onChange={(value) => {
              setCategory(value);
              setStatus('idle');
            }}
            options={[
              { value: 'vocabulary', label: t(CATEGORY_LABEL_KEYS.vocabulary), icon: <IconBook size={18} stroke={2} /> },
              { value: 'kanji', label: t(CATEGORY_LABEL_KEYS.kanji), icon: <IconWriting size={18} stroke={2} /> },
            ]}
          />
        </div>
        <SelectField
          id="manage-lesson-book"
          label={t('lessonForm.book')}
          value={bookId}
          onChange={(value) => {
            setBookId(value);
            setStatus('idle');
          }}
          options={bookOptions}
        />
        <p className="text-sm text-text-secondary">
          {t('manageLesson.itemCount', { count: counts.items(lesson.items.length) })}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={<IconDeviceFloppy size={20} stroke={2} />}
            disabled={!titleValid || !dirty}
            className="w-full sm:w-auto"
          >
            {t('manageLesson.save')}
          </Button>
          <span role="status" className="text-sm text-text-secondary">
            {status === 'saved' ? t('manageBook.saved') : status === 'error' ? t('common.saveError') : ''}
          </span>
        </div>
      </form>

      <section aria-labelledby="ml-items-heading" className="mt-6 space-y-2">
        <SectionLabel id="ml-items-heading">
          {t('manageLesson.items')} ({counts.items(lesson.items.length)})
        </SectionLabel>
        {lesson.items.length > 0 && (
          <ol className="bg-surface border border-border-subtle rounded-xl divide-y divide-border-subtle overflow-hidden max-h-80 overflow-y-auto">
            {lesson.items.map((item, index) => (
              <li key={item.id} className="px-4 py-2.5 flex items-baseline gap-3 text-sm">
                <span className="w-6 shrink-0 text-xs text-text-muted tabular-nums">{index + 1}.</span>
                <span className="min-w-0 flex-1 leading-relaxed break-words">
                  <span lang="ja" className="font-japanese font-semibold text-text-primary">
                    {item.japanese}
                  </span>
                  {item.kana && (
                    <span lang="ja" className="font-japanese text-text-secondary"> ({item.kana})</span>
                  )}
                  {formatMeanings(item) && <span className="text-text-secondary"> — {formatMeanings(item)}</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="mt-8">
        <DangerZone
          headingId="ml-danger-heading"
          description={t('manageLesson.dangerDesc', { count: counts.items(lesson.items.length) })}
          actionLabel={t('manageLesson.delete')}
          onAction={() => setDeleteOpen(true)}
        />
      </div>

      {/* SCREEN 26 — Delete Lesson */}
      <ConfirmDialog
        open={deleteOpen}
        title={t('deleteLesson.title')}
        cancelLabel={t('dialog.cancel')}
        confirmLabel={t('dialog.deletePermanently')}
        onCancel={() => {
          if (deleteBusy) return;
          setDeleteOpen(false);
          setDeleteError(null);
        }}
        onConfirm={() => void confirmDelete()}
        busy={deleteBusy}
        error={deleteError}
      >
        <p className="rounded-lg bg-surface-elevated border border-border-subtle px-3 py-2">
          <span className="block font-study-title font-bold text-text-primary break-words">
            {lesson.title} — {t(CATEGORY_LABEL_KEYS[lesson.category])}
          </span>
          <span className="block font-study-title text-sm text-text-secondary break-words">
            {t('lessonForm.book')}: {parentBook ? parentBook.title : t('common.unassigned')}
          </span>
        </p>
        <p>{t('deleteLesson.items', { count: counts.items(lesson.items.length) })}</p>
        <p>
          {parentBook
            ? t('deleteLesson.preserveBook', { title: parentBook.title })
            : t('deleteLesson.preserveOther')}
        </p>
        <p className="font-semibold text-text-primary">{t('dialog.irreversible')}</p>
      </ConfirmDialog>
    </Screen>
  );
};
