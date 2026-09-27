import React, { useEffect, useId, useRef, useState } from 'react';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBook,
  IconCheck,
  IconCircleCheckFilled,
  IconDownload,
  IconFileImport,
  IconLoader2,
  IconWriting,
} from '@tabler/icons-react';
import { StudyCategory } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { useNavigation } from '../../hooks/useNavigation';
import { useI18n } from '../../hooks/useI18n';
import { useCounts } from '../../hooks/useCounts';
import {
  ColumnMapping,
  DelimiterChoice,
  IMPORT_FIELDS,
  IMPORT_FILE_ACCEPT,
  ImportField,
  ImportSummary,
  TEMPLATE_ROWS,
  buildImportItems,
  buildTemplate,
  detectHeader,
  getImportFileKind,
  needsMappingConfirmation,
  parseTextToRows,
  toStudyItemFields,
} from '../../lib/importer';
import { buildXlsx, readXlsxRows } from '../../lib/xlsx';
import { createLesson, isValidTitle } from '../../lib/contentActions';
import { Screen, ScreenHeader, SectionLabel, StickyBottomBar } from '../../components/Screen';
import { Button, FOCUS_RING } from '../../components/Button';
import { CheckboxRow, SegmentedControl, SelectField, TextField } from '../../components/FormControls';
import { CATEGORY_LABEL_KEYS, InlineNotice } from '../study/StudyParts';
import { TranslationKey } from '../../lib/i18n';

type Step = 1 | 2 | 3 | 4;
type Method = 'paste' | 'file';

const UNASSIGNED_VALUE = '';

const DELIMITER_OPTIONS: { value: DelimiterChoice; labelKey: TranslationKey }[] = [
  { value: 'auto', labelKey: 'import.delimiter.auto' },
  { value: 'tab', labelKey: 'import.delimiter.tab' },
  { value: 'semicolon', labelKey: 'import.delimiter.semicolon' },
  { value: 'pipe', labelKey: 'import.delimiter.pipe' },
  { value: 'comma', labelKey: 'import.delimiter.comma' },
  { value: 'custom', labelKey: 'import.delimiter.custom' },
];

const FIELD_LABEL_KEYS: Record<ImportField, TranslationKey> = {
  japanese: 'import.field.japanese',
  kana: 'import.field.kana',
  hanViet: 'import.field.hanViet',
  vietnamese: 'import.field.vietnamese',
};

/** Preselected book from `?book=<id>` (import opened from Manage Study Book). */
function readPreselectedBook(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('book');
}

function downloadFile(name: string, content: BlobPart, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * SCREEN 21 – 24 — Add / Import Lesson (`/settings/content-management/import`).
 * One importer for both categories and every book: input → column mapping (only when the
 * header is not recognized) → preview with non-blocking warnings → completion.
 */
export const ImportScreen: React.FC = () => {
  const { state, commitStudyData } = useAppState();
  const { navigate, goBack, goUp } = useNavigation();
  const { t } = useI18n();
  const counts = useCounts();
  const titleFieldId = useId();

  const [step, setStep] = useState<Step>(1);
  const [bookId, setBookId] = useState<string>(() => {
    const preselected = readPreselectedBook();
    return preselected && state.books[preselected] ? preselected : UNASSIGNED_VALUE;
  });
  const [category, setCategory] = useState<StudyCategory>('vocabulary');
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [method, setMethod] = useState<Method>('paste');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [delimiter, setDelimiter] = useState<DelimiterChoice>('auto');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const [rows, setRows] = useState<string[][]>([]);
  const [hasHeader, setHasHeader] = useState(false);
  const [mapping, setMapping] = useState<ColumnMapping>({ japanese: 0, kana: 1, hanViet: 2, vietnamese: 3 });
  const [showedMapping, setShowedMapping] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [createdLesson, setCreatedLesson] = useState<{ id: string; count: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Each import step starts at the top of the page
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  }, [step]);

  const exitRoute = bookId && readPreselectedBook() === bookId
    ? ({ type: 'manage_book', bookId } as const)
    : ({ type: 'content_management' } as const);
  const exit = () => goBack(exitRoute);

  const back = () => {
    if (step === 1 || step === 4) exit();
    else if (step === 2) setStep(1);
    else setStep(showedMapping ? 2 : 1);
  };

  const summary: ImportSummary | null =
    step >= 2 && rows.length > 0 ? buildImportItems(rows, mapping, hasHeader) : null;

  const bookTitle = bookId && state.books[bookId] ? state.books[bookId].title : t('common.unassigned');
  const categoryLabel = t(CATEGORY_LABEL_KEYS[category]);

  const continueFromInput = async () => {
    setTitleTouched(true);
    setInputError(null);
    if (!isValidTitle(title)) {
      document.getElementById(titleFieldId)?.focus();
      return;
    }
    setProcessing(true);
    try {
      let parsed: string[][];
      if (method === 'file') {
        if (!file) {
          setInputError(t('import.noInput'));
          return;
        }
        const kind = getImportFileKind(file.name);
        if (kind === 'xlsx') {
          parsed = await readXlsxRows(await file.arrayBuffer());
        } else if (kind === 'text') {
          parsed = parseTextToRows(await file.text(), { delimiter, customDelimiter });
        } else {
          setInputError(t('import.fileInvalid'));
          return;
        }
      } else {
        if (text.trim() === '') {
          setInputError(t('import.noInput'));
          return;
        }
        parsed = parseTextToRows(text, { delimiter, customDelimiter });
      }
      if (parsed.length === 0) {
        setInputError(t('import.noRows'));
        return;
      }
      const detection = detectHeader(parsed);
      setRows(parsed);
      setHasHeader(detection.hasHeader);
      setMapping(detection.mapping);
      const confirm = needsMappingConfirmation(detection);
      setShowedMapping(confirm);
      setStep(confirm ? 2 : 3);
    } catch (error) {
      console.error('Failed to read import input:', error);
      setInputError(t('import.fileReadError'));
    } finally {
      setProcessing(false);
    }
  };

  const confirmImport = () => {
    if (!summary || summary.items.length === 0) return;
    try {
      const lesson = createLesson(
        { title, category, bookId: bookId || undefined },
        summary.items.map(toStudyItemFields)
      );
      commitStudyData({ lessons: { ...state.lessons, [lesson.id]: lesson } });
      setCreatedLesson({ id: lesson.id, count: lesson.items.length });
      setSaveError(null);
      setStep(4);
    } catch (error) {
      console.error('Failed to save imported lesson:', error);
      setSaveError(t('common.saveError'));
    }
  };

  const columnCount = Math.max(0, ...rows.map((row) => row.length));
  const sampleRow = rows[hasHeader ? 1 : 0] ?? rows[0] ?? [];
  const headerRow = hasHeader ? rows[0] : undefined;

  const stepName = t(`import.step.${step}` as TranslationKey);
  const bookOptions = [
    ...Object.values(state.books).map((book) => ({ value: book.id, label: book.title })),
    { value: UNASSIGNED_VALUE, label: t('common.unassigned') },
  ];

  /* ---------------------------------------------------------------- Step 1 */
  const inputStep = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void continueFromInput();
      }}
      noValidate
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField id="import-book" label={t('import.chooseBook')} value={bookId} onChange={setBookId} options={bookOptions} />
        <div>
          <p id="import-category" className="text-sm font-semibold text-text-primary mb-1.5">
            {t('lessonForm.category')}
          </p>
          <SegmentedControl
            labelledBy="import-category"
            value={category}
            onChange={setCategory}
            options={[
              { value: 'vocabulary', label: t('category.vocabulary'), icon: <IconBook size={18} stroke={2} /> },
              { value: 'kanji', label: t('category.kanji'), icon: <IconWriting size={18} stroke={2} /> },
            ]}
          />
        </div>
      </div>

      <TextField
        id={titleFieldId}
        label={t('lessonForm.title')}
        required
        value={title}
        onChange={setTitle}
        onBlur={() => setTitleTouched(true)}
        placeholder={t('lessonForm.titlePlaceholder')}
        error={titleTouched && !isValidTitle(title) ? t('lessonForm.titleRequired') : undefined}
        maxLength={200}
      />

      <div>
        <p id="import-method" className="text-sm font-semibold text-text-primary mb-1.5">
          {t('import.method')}
        </p>
        <SegmentedControl
          labelledBy="import-method"
          value={method}
          onChange={(value) => {
            setMethod(value);
            setInputError(null);
          }}
          options={[
            { value: 'paste', label: t('import.method.paste') },
            { value: 'file', label: t('import.method.file') },
          ]}
        />
      </div>

      {method === 'paste' ? (
        <div>
          <label htmlFor="import-text" className="block text-sm font-semibold text-text-primary mb-1.5">
            {t('import.pasteLabel')}
          </label>
          <textarea
            id="import-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('import.pastePlaceholder')}
            rows={8}
            spellCheck={false}
            className="w-full min-h-[11rem] rounded-md bg-surface border border-border-strong px-3.5 py-3 font-study-title text-[15px] leading-relaxed text-text-primary placeholder:text-text-muted resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          />
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border-strong bg-surface p-5 flex flex-col items-center text-center gap-3">
          <span aria-hidden="true" className="w-11 h-11 rounded-xl bg-primary-surface text-primary flex items-center justify-center">
            <IconFileImport size={22} stroke={1.75} />
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept={IMPORT_FILE_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const picked = e.target.files?.[0] ?? null;
              e.target.value = '';
              if (picked && !getImportFileKind(picked.name)) {
                setFile(null);
                setInputError(t('import.fileInvalid'));
                return;
              }
              setInputError(null);
              setFile(picked);
            }}
          />
          <Button onClick={() => fileInputRef.current?.click()}>{t('import.fileChoose')}</Button>
          <p className="text-sm text-text-secondary break-all">
            {file ? t('import.fileSelected', { name: file.name }) : t('import.fileFormats')}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="import-delimiter"
          label={t('import.delimiter')}
          value={delimiter}
          onChange={(value) => setDelimiter(value as DelimiterChoice)}
          options={DELIMITER_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
        />
        {delimiter === 'custom' && (
          <TextField
            id="import-custom-delimiter"
            label={t('import.customDelimiter')}
            value={customDelimiter}
            onChange={(value) => setCustomDelimiter(value.slice(0, 3))}
            maxLength={3}
          />
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-text-primary mb-1.5">{t('import.templates')}</p>
        <div className="flex flex-wrap gap-2">
          {(['txt', 'csv', 'md'] as const).map((kind) => (
            <Button
              key={kind}
              variant="quiet"
              icon={<IconDownload size={16} stroke={2} />}
              onClick={() => downloadFile(`tango_template.${kind}`, buildTemplate(kind), kind === 'csv' ? 'text/csv' : 'text/plain')}
            >
              {kind === 'md' ? 'Markdown' : kind.toUpperCase()}
            </Button>
          ))}
          <Button
            variant="quiet"
            icon={<IconDownload size={16} stroke={2} />}
            onClick={() =>
              downloadFile(
                'tango_template.xlsx',
                new Uint8Array(buildXlsx(TEMPLATE_ROWS)),
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              )
            }
          >
            Excel
          </Button>
        </div>
      </div>

      {inputError && (
        <InlineNotice tone="warning" icon={<IconAlertTriangle size={18} stroke={2} />}>
          {inputError}
        </InlineNotice>
      )}
    </form>
  );

  /* ---------------------------------------------------------------- Step 2 */
  const mappingStep = (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-text-primary">{t('import.mapping.title')}</h2>
        <p className="mt-1 text-sm text-text-secondary leading-relaxed">{t('import.mapping.desc')}</p>
      </div>
      <div className="-mx-3">
        <CheckboxRow checked={hasHeader} onChange={setHasHeader} label={t('import.mapping.firstRowHeader')} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {IMPORT_FIELDS.map((field) => (
          <div key={field} className="bg-surface border border-border-subtle rounded-xl p-4">
            <SelectField
              id={`import-map-${field}`}
              label={t(FIELD_LABEL_KEYS[field])}
              value={String(mapping[field])}
              onChange={(value) => setMapping((current) => ({ ...current, [field]: Number(value) }))}
              options={[
                { value: '-1', label: t('import.mapping.none') },
                ...Array.from({ length: columnCount }, (_, index) => ({
                  value: String(index),
                  label: t('import.mapping.column', {
                    index: index + 1,
                    sample: (headerRow?.[index] || sampleRow[index] || '—').slice(0, 24),
                  }),
                })),
              ]}
            />
          </div>
        ))}
      </div>
      {mapping.japanese === -1 && (
        <InlineNotice tone="warning" icon={<IconAlertTriangle size={18} stroke={2} />}>
          {t('import.mapping.needJapanese')}
        </InlineNotice>
      )}
    </div>
  );

  /* ---------------------------------------------------------------- Step 3 */
  const readyCount = summary?.items.length ?? 0;
  const badges = summary
    ? ([
        { key: 'ready', show: true, tone: 'ok', text: t('import.badge.ready', { count: readyCount }) },
        { key: 'warn', show: summary.warningItems > 0, tone: 'warn', text: t('import.badge.warnings', { count: summary.warningItems }) },
        { key: 'dup', show: summary.duplicateRows > 0, tone: 'ok', text: t('import.badge.duplicates', { count: summary.duplicateRows }) },
        { key: 'merged', show: summary.mergedItems > 0, tone: 'ok', text: t('import.badge.merged', { count: summary.mergedItems }) },
        { key: 'conflict', show: summary.conflictItems > 0, tone: 'warn', text: t('import.badge.conflicts', { count: summary.conflictItems }) },
        { key: 'invalid', show: summary.invalidRows > 0, tone: 'warn', text: t('import.badge.invalid', { count: summary.invalidRows }) },
      ] as const).filter((badge) => badge.show)
    : [];

  const warningLabel = (warnings: string[]) =>
    warnings
      .map((w) =>
        w === 'noKana' ? t('import.warning.noKana') : w === 'noMeaning' ? t('import.warning.noMeaning') : t('import.warning.conflict')
      )
      .join(' · ');

  const previewStep = summary && (
    <div className="space-y-5">
      <dl className="bg-surface border border-border-subtle rounded-xl p-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-text-muted">{t('import.summary.book')}</dt>
        <dd className="font-study-title font-semibold text-text-primary break-words">{bookTitle}</dd>
        <dt className="text-text-muted">{t('import.summary.category')}</dt>
        <dd className="font-semibold text-text-primary">{categoryLabel}</dd>
        <dt className="text-text-muted">{t('import.summary.lesson')}</dt>
        <dd className="font-study-title font-semibold text-text-primary break-words">{title.trim()}</dd>
        <dt className="text-text-muted">{t('import.summary.count')}</dt>
        <dd className="font-semibold text-text-primary">{counts.items(readyCount)}</dd>
      </dl>

      <ul className="flex flex-wrap gap-2" aria-label={t('import.step.3')}>
        {badges.map((badge) => (
          <li
            key={badge.key}
            className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs sm:text-sm font-semibold leading-snug ${
              badge.tone === 'warn'
                ? 'border-warning text-text-primary bg-surface'
                : 'border-border-strong text-text-primary bg-surface-elevated'
            }`}
          >
            {badge.tone === 'warn' ? (
              <IconAlertTriangle size={15} stroke={2} aria-hidden="true" className="text-warning shrink-0" />
            ) : (
              <IconCheck size={15} stroke={2.5} aria-hidden="true" className="text-success shrink-0" />
            )}
            {badge.text}
          </li>
        ))}
      </ul>
      {summary.warningItems + summary.conflictItems > 0 && (
        <p className="text-sm text-text-secondary">{t('import.warningNote')}</p>
      )}

      {showedMapping || hasHeader ? (
        <button type="button" onClick={() => setStep(2)} className={`min-h-touch px-1 text-sm font-semibold text-primary rounded-md ${FOCUS_RING}`}>
          {t('import.adjustMapping')}
        </button>
      ) : null}

      {readyCount === 0 ? (
        <InlineNotice tone="warning" icon={<IconAlertTriangle size={18} stroke={2} />}>
          {t('import.noValid')}
        </InlineNotice>
      ) : (
        <>
          {/* Mobile: stacked cards (first 5) */}
          <ol className="sm:hidden space-y-3">
            {summary.items.slice(0, 5).map((item, index) => (
              <li key={`${item.japanese}-${index}`} className="bg-surface border border-border-subtle rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{t('import.itemOf', { index: index + 1, total: readyCount })}</span>
                  {item.warnings.length > 0 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-warning">
                      <IconAlertTriangle size={14} stroke={2} aria-hidden="true" />
                      {warningLabel(item.warnings)}
                    </span>
                  )}
                </div>
                <p lang="ja" className="mt-2 font-japanese text-xl font-bold text-text-primary break-words">
                  {item.japanese}
                </p>
                <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-text-muted">{t('import.col.kana')}</dt>
                  <dd lang="ja" className="font-japanese text-text-primary break-words">{item.kana ?? '—'}</dd>
                  {item.hanViet && (
                    <>
                      <dt className="text-text-muted">{t('import.col.hanViet')}</dt>
                      <dd className="text-text-primary uppercase break-words">{item.hanViet}</dd>
                    </>
                  )}
                  <dt className="text-text-muted">{t('import.col.vietnamese')}</dt>
                  <dd className="text-text-primary break-words">{item.vietnamese.join(', ') || '—'}</dd>
                </dl>
              </li>
            ))}
            {readyCount > 5 && (
              <li className="text-center text-sm text-text-muted">{t('import.moreRows', { count: readyCount - 5 })}</li>
            )}
          </ol>

          {/* Tablet / desktop: scrollable table with every row */}
          <div className="hidden sm:block max-h-96 overflow-auto rounded-xl border border-border-subtle bg-surface">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-elevated text-left text-xs uppercase tracking-wider text-text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold w-10">#</th>
                  <th scope="col" className="px-3 py-2 font-semibold">{t('import.col.japanese')}</th>
                  <th scope="col" className="px-3 py-2 font-semibold">{t('import.col.kana')}</th>
                  <th scope="col" className="px-3 py-2 font-semibold">{t('import.col.hanViet')}</th>
                  <th scope="col" className="px-3 py-2 font-semibold">{t('import.col.vietnamese')}</th>
                  <th scope="col" className="px-3 py-2 font-semibold">{t('import.col.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {summary.items.map((item, index) => (
                  <tr key={`${item.japanese}-${index}`} className="align-top">
                    <td className="px-3 py-2 text-text-muted tabular-nums">{index + 1}</td>
                    <td lang="ja" className="px-3 py-2 font-japanese font-semibold text-text-primary">{item.japanese}</td>
                    <td lang="ja" className="px-3 py-2 font-japanese text-text-secondary">{item.kana ?? ''}</td>
                    <td className="px-3 py-2 uppercase text-text-secondary">{item.hanViet ?? ''}</td>
                    <td className="px-3 py-2 text-text-primary">{item.vietnamese.join(', ')}</td>
                    <td className="px-3 py-2">
                      {item.warnings.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-warning font-semibold">
                          <IconAlertTriangle size={16} stroke={2} aria-hidden="true" />
                          <span className="text-xs">{warningLabel(item.warnings)}</span>
                        </span>
                      ) : (
                        <span className="inline-flex text-success">
                          <IconCheck size={18} stroke={2.5} aria-hidden="true" />
                          <span className="sr-only">{t('import.statusOk')}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {saveError && (
        <InlineNotice tone="warning" icon={<IconAlertTriangle size={18} stroke={2} />}>
          {saveError}
        </InlineNotice>
      )}
    </div>
  );

  /* ---------------------------------------------------------------- Step 4 */
  const doneStep = createdLesson && (
    <div className="bg-surface border border-border-subtle rounded-2xl shadow-clay-card p-6 sm:p-8 text-center flex flex-col items-center gap-4 max-w-lg mx-auto">
      <IconCircleCheckFilled size={52} className="text-success" aria-hidden="true" />
      <h2 className="text-xl font-bold text-text-primary">{t('import.done.title')}</h2>
      <p className="font-study-title text-[15px] text-text-secondary leading-relaxed break-words">
        {bookId
          ? t('import.done.summary', { count: counts.items(createdLesson.count), lesson: title.trim(), category: categoryLabel, book: bookTitle })
          : t('import.done.summaryUnassigned', { count: counts.items(createdLesson.count), lesson: title.trim(), category: categoryLabel })}
      </p>
      <div className="w-full flex flex-col gap-3 pt-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          trailingIcon={<IconArrowRight size={20} stroke={2} />}
          onClick={() => navigate({ type: 'lesson_detail', lessonId: createdLesson.id })}
          autoFocus
        >
          {t('import.done.study')}
        </Button>
        <Button variant="secondary" fullWidth onClick={() => goUp({ type: 'content_management' })}>
          {t('import.done.back')}
        </Button>
      </div>
    </div>
  );

  const primaryAction =
    step === 1 ? (
      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={processing}
        trailingIcon={processing ? undefined : <IconArrowRight size={20} stroke={2} />}
        icon={processing ? <IconLoader2 size={20} stroke={2} className="animate-spin" /> : undefined}
        onClick={() => void continueFromInput()}
      >
        {processing ? t('import.processing') : t('import.continue')}
      </Button>
    ) : step === 2 ? (
      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={() => setStep(1)} className="shrink-0 whitespace-nowrap">
          {t('import.back')}
        </Button>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={mapping.japanese === -1}
          onClick={() => setStep(3)}
        >
          {t('import.mapping.preview')}
        </Button>
      </div>
    ) : step === 3 ? (
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button variant="secondary" size="lg" onClick={() => setStep(1)} className="shrink-0 whitespace-nowrap">
          {t('import.backToEdit')}
        </Button>
        <Button variant="primary" size="lg" fullWidth disabled={readyCount === 0} onClick={confirmImport}>
          {t('import.confirm', { count: counts.items(readyCount) })}
        </Button>
      </div>
    ) : null;

  return (
    <Screen
      width="3xl"
      onEscape={back}
      header={
        <ScreenHeader
          title={t('import.title')}
          subtitle={t('import.stepOf', { step, name: stepName })}
          onBack={back}
          width="3xl"
        />
      }
      bottomBar={primaryAction ? <StickyBottomBar width="3xl">{primaryAction}</StickyBottomBar> : undefined}
    >
      <SectionLabel className="sr-only">{stepName}</SectionLabel>
      {step === 1 && inputStep}
      {step === 2 && mappingStep}
      {step === 3 && previewStep}
      {step === 4 && doneStep}
    </Screen>
  );
};
