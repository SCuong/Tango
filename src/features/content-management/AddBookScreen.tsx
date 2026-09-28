import React, { useEffect, useId, useRef, useState } from 'react';
import { IconPhoto, IconX } from '@tabler/icons-react';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { createStudyBook, isValidTitle } from '../../lib/contentActions';
import { COVER_ACCEPT, isSupportedCoverFile, storeCoverBlob } from '../../lib/coverImage';
import { deleteCoverBlob } from '../../lib/storage';
import { ModalRoute } from '../../components/ModalRoute';
import { Button } from '../../components/Button';
import { TextField } from '../../components/FormControls';
import { InlineNotice } from '../study/StudyParts';

/** Object URL for a selected (not yet stored) file, revoked when replaced or unmounted. */
export function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      setUrl(null);
      return undefined;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

/**
 * SCREEN 18 — Add Study Book (`/settings/content-management/add-book`).
 * Required title (duplicates allowed) and an optional .jpg/.jpeg/.png/.webp cover stored as a
 * Blob in IndexedDB before the book metadata is saved.
 */
export const AddBookScreen: React.FC = () => {
  const { state, commitStudyData } = useAppState();
  const { goUp } = useNavigation();
  const { t } = useI18n();
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [touched, setTouched] = useState(false);
  const [cover, setCover] = useState<File | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const previewUrl = useObjectUrl(cover);
  const close = () => goUp({ type: 'content_management' });

  const titleValid = isValidTitle(title);

  const onPickCover = (file: File | undefined) => {
    if (!file) return;
    if (!isSupportedCoverFile(file)) {
      setCoverError(t('bookForm.coverInvalid'));
      return;
    }
    setCoverError(null);
    setCover(file);
  };

  const submit = async () => {
    setTouched(true);
    if (!titleValid || saving) return;
    setSaving(true);
    setSaveError(null);
    let coverImageId: string | undefined;
    try {
      if (cover) coverImageId = await storeCoverBlob(cover);
      const book = createStudyBook(title, coverImageId, new Date());
      commitStudyData({ books: { ...state.books, [book.id]: book } });
      close();
    } catch (error) {
      console.error('Failed to create study book:', error);
      if (coverImageId) void deleteCoverBlob(coverImageId).catch(() => undefined);
      setSaveError(t('common.saveError'));
      setSaving(false);
    }
  };

  return (
    <ModalRoute
      titleId={titleId}
      title={t('addBook.title')}
      onClose={close}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="quiet" onClick={close} className="hidden sm:inline-flex">
            {t('action.cancel')}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => void submit()}
            disabled={!titleValid || saving}
            className="w-full sm:w-auto"
          >
            {saving && cover ? t('bookForm.savingCover') : t('bookForm.create')}
          </Button>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-6"
        noValidate
      >
        <TextField
          id="add-book-title"
          label={t('bookForm.title')}
          required
          value={title}
          onChange={(value) => {
            setTitle(value);
            setTouched(true);
          }}
          onBlur={() => setTouched(true)}
          placeholder={t('bookForm.titlePlaceholder')}
          error={touched && !titleValid ? t('bookForm.titleRequired') : undefined}
          autoFocus
          maxLength={200}
        />

        <div>
          <p className="text-sm font-semibold text-text-primary mb-1.5">{t('bookForm.cover')}</p>
          <div className="flex items-start gap-4">
            <div className="w-24 aspect-[3/4] rounded-xl overflow-hidden border border-border-subtle bg-surface-elevated shrink-0 flex items-center justify-center text-text-muted">
              {previewUrl ? (
                <img src={previewUrl} alt={t('bookForm.coverPreview')} className="w-full h-full object-cover" />
              ) : (
                <IconPhoto size={26} stroke={1.5} aria-hidden="true" />
              )}
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
                  onPickCover(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <Button icon={<IconPhoto size={18} stroke={2} />} onClick={() => fileInputRef.current?.click()}>
                {cover ? t('bookForm.changeCover') : t('bookForm.chooseCover')}
              </Button>
              {cover && (
                <Button variant="quiet" icon={<IconX size={18} stroke={2} />} onClick={() => setCover(null)}>
                  {t('bookForm.clearSelection')}
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

        {saveError && <InlineNotice tone="warning">{saveError}</InlineNotice>}
      </form>
    </ModalRoute>
  );
};
