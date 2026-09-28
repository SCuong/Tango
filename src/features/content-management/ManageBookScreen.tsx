import React, { useRef, useState } from 'react';
import { IconDeviceFloppy, IconPhoto, IconPlus, IconTrash } from '@tabler/icons-react';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { useCounts } from '../../hooks/useCounts';
import { getBookStudyMetrics } from '../../lib/studyMetrics';
import { getBookLessons } from '../../lib/studySelectors';
import {
  deleteBookCascade,
  isValidTitle,
  normalizeTitle,
  removeBookCover,
  updateStudyBook,
} from '../../lib/contentActions';
import { COVER_ACCEPT, isSupportedCoverFile, replaceBookCover } from '../../lib/coverImage';
import { buildPath } from '../../lib/routes';
import { Screen, ScreenHeader, SectionLabel } from '../../components/Screen';
import { Button } from '../../components/Button';
import { TextField } from '../../components/FormControls';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { dismissModalHistory } from '../../components/Dialog';
import { NotFoundScreen } from '../../components/NotFoundScreen';
import { BookCover } from '../books/BookCover';
import { InlineNotice } from '../study/StudyParts';
import { useQuizSession } from '../quiz/QuizSessionContext';
import { DangerZone, ManagedLessonRow } from './ContentParts';

/**
 * SCREEN 19 — Manage Study Book (`/settings/content-management/book/:bookId`).
 * Rename, replace/remove cover, lesson roster (manage only, no inline delete), add a lesson into
 * this book, and the book Danger Zone (SCREEN 25 / 27 dialogs).
 */
export const ManageBookScreen: React.FC<{ bookId: string }> = ({ bookId }) => {
  const { state, commitStudyData, reloadState } = useAppState();
  const { navigate, goUp } = useNavigation();
  const { clearLessonReferences } = useQuizSession();
  const { t } = useI18n();
  const counts = useCounts();
  const book = state.books[bookId];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(book?.title ?? '');
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'none' | 'deleteBook' | 'removeCover'>('none');
  const [dialogBusy, setDialogBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const goToContent = () => goUp({ type: 'content_management' });

  if (deleted) return null;

  if (!book) {
    return <NotFoundScreen message={t('common.notFound.book')} onBack={goToContent} />;
  }

  const lessons = getBookLessons(state.lessons, bookId);
  const metrics = getBookStudyMetrics(bookId, state.lessons, state.progressByItem);
  const titleValid = isValidTitle(title);
  const titleDirty = normalizeTitle(title) !== book.title;

  const saveTitle = () => {
    if (!titleValid || !titleDirty) return;
    try {
      commitStudyData({
        books: { ...state.books, [bookId]: updateStudyBook(book, { title }, new Date()) },
      });
      setTitle(normalizeTitle(title));
      setStatus('saved');
    } catch (error) {
      console.error('Failed to rename book:', error);
      setStatus('error');
    }
  };

  const onPickCover = async (file: File | undefined) => {
    if (!file) return;
    if (!isSupportedCoverFile(file)) {
      setCoverError(t('bookForm.coverInvalid'));
      return;
    }
    setCoverError(null);
    setCoverBusy(true);
    try {
      await replaceBookCover(bookId, file, new Date());
      reloadState();
    } catch (error) {
      console.error('Failed to replace cover:', error);
      setCoverError(t('common.saveError'));
    } finally {
      setCoverBusy(false);
    }
  };

  const closeDialog = () => {
    if (dialogBusy) return;
    setDialog('none');
    setDialogError(null);
  };

  const confirmRemoveCover = async () => {
    setDialogBusy(true);
    try {
      await removeBookCover(bookId, new Date());
      reloadState();
      setDialogBusy(false);
      setDialog('none');
    } catch (error) {
      console.error('Failed to remove cover:', error);
      setDialogError(t('dialog.deleteError'));
      setDialogBusy(false);
    }
  };

  const confirmDeleteBook = async () => {
    setDialogBusy(true);
    try {
      await deleteBookCascade(bookId, (scope) => clearLessonReferences(scope.affectedLessonIds));
      await dismissModalHistory();
      setDeleted(true);
      reloadState();
      goToContent();
    } catch (error) {
      console.error('Failed to delete book:', error);
      setDialogError(t('dialog.deleteError'));
      setDialogBusy(false);
    }
  };

  return (
    <Screen
      width="4xl"
      onEscape={goToContent}
      header={
        <ScreenHeader title={t('manageBook.title', { title: book.title })} onBack={goToContent} width="4xl" />
      }
    >
      <div className="grid gap-6 sm:grid-cols-[2fr_3fr] sm:items-start">
        {/* Book details: title and cover */}
        <section
          aria-labelledby="mb-details-heading"
          className="bg-surface border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-5 sm:col-start-1 sm:row-start-1"
        >
          <SectionLabel id="mb-details-heading">{t('manageBook.details')}</SectionLabel>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveTitle();
            }}
            className="space-y-3"
            noValidate
          >
            <TextField
              id="manage-book-title"
              label={t('bookForm.title')}
              required
              value={title}
              onChange={(value) => {
                setTitle(value);
                setStatus('idle');
              }}
              error={!titleValid ? t('bookForm.titleRequired') : undefined}
              maxLength={200}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" icon={<IconDeviceFloppy size={18} stroke={2} />} disabled={!titleValid || !titleDirty}>
                {t('manageBook.saveTitle')}
              </Button>
              <span role="status" className="text-sm text-text-secondary">
                {status === 'saved' ? t('manageBook.saved') : status === 'error' ? t('common.saveError') : ''}
              </span>
            </div>
          </form>

          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">{t('bookForm.coverLabel')}</p>
            <div className="flex items-start gap-4">
              <div className="w-24 aspect-[3/4] rounded-xl overflow-hidden border border-border-subtle shrink-0">
                <BookCover coverImageId={book.coverImageId} title={book.title} />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={COVER_ACCEPT}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(e) => {
                    void onPickCover(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <Button
                  icon={<IconPhoto size={18} stroke={2} />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={coverBusy}
                >
                  {coverBusy
                    ? t('bookForm.savingCover')
                    : book.coverImageId
                      ? t('bookForm.changeCover')
                      : t('bookForm.chooseCover')}
                </Button>
                {book.coverImageId && (
                  <Button
                    variant="quiet"
                    icon={<IconTrash size={18} stroke={2} />}
                    onClick={() => setDialog('removeCover')}
                    disabled={coverBusy}
                  >
                    {t('bookForm.removeCover')}
                  </Button>
                )}
                <p className="text-xs text-text-muted leading-relaxed">{t('bookForm.coverFormats')}</p>
              </div>
            </div>
            {coverError && (
              <p role="alert" className="mt-2 text-sm font-medium text-error-text">
                {coverError}
              </p>
            )}
          </div>
        </section>

        {/* Lesson roster */}
        <section aria-labelledby="mb-lessons-heading" className="space-y-3 sm:col-start-2 sm:row-start-1 sm:row-span-2">
          <SectionLabel id="mb-lessons-heading">{t('manageBook.lessons', { count: lessons.length })}</SectionLabel>
          {lessons.length === 0 ? (
            <InlineNotice>{t('manageBook.noLessons')}</InlineNotice>
          ) : (
            <ul className="bg-surface border border-border-subtle rounded-xl divide-y divide-border-subtle overflow-hidden">
              {lessons.map((lesson) => (
                <ManagedLessonRow
                  key={lesson.id}
                  lesson={lesson}
                  onManage={() => navigate({ type: 'manage_lesson', lessonId: lesson.id })}
                />
              ))}
            </ul>
          )}
          <Button
            icon={<IconPlus size={18} stroke={2} />}
            onClick={() => navigate(`${buildPath({ type: 'import' })}?book=${encodeURIComponent(bookId)}`)}
          >
            {t('manageBook.addLesson')}
          </Button>
        </section>

        <div className="sm:col-start-1 sm:row-start-2">
          <DangerZone
            headingId="mb-danger-heading"
            description={t('manageBook.dangerDesc')}
            actionLabel={t('manageBook.delete')}
            onAction={() => setDialog('deleteBook')}
          />
        </div>
      </div>

      {/* SCREEN 25 — Delete Book */}
      <ConfirmDialog
        open={dialog === 'deleteBook'}
        title={t('deleteBook.title')}
        cancelLabel={t('dialog.cancel')}
        confirmLabel={t('dialog.deletePermanently')}
        onCancel={closeDialog}
        onConfirm={() => void confirmDeleteBook()}
        busy={dialogBusy}
        error={dialogError}
      >
        <p>{t('deleteBook.intro')}</p>
        <p className="rounded-lg bg-surface-elevated border border-border-subtle px-3 py-2">
          <span className="block font-study-title font-bold text-text-primary break-words">{book.title}</span>
          <span className="block text-sm text-text-secondary">
            {t('metrics.lessonsAndItems', {
              lessons: counts.lessons(metrics.lessonCount),
              items: counts.items(metrics.itemCount),
            })}
          </span>
        </p>
        <p>{t('deleteBook.cascade')}</p>
        <p className="font-semibold text-text-primary">{t('dialog.irreversible')}</p>
      </ConfirmDialog>

      {/* SCREEN 27 — Remove Cover */}
      <ConfirmDialog
        open={dialog === 'removeCover'}
        title={t('removeCover.title')}
        cancelLabel={t('removeCover.cancel')}
        confirmLabel={t('removeCover.confirm')}
        onCancel={closeDialog}
        onConfirm={() => void confirmRemoveCover()}
        busy={dialogBusy}
        error={dialogError}
      >
        <p className="font-study-title font-semibold text-text-primary break-words">{book.title}</p>
        <p>{t('removeCover.body')}</p>
      </ConfirmDialog>
    </Screen>
  );
};
