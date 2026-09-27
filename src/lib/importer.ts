/**
 * Tango — Lesson Import Parsing, Mapping, Deduplication & Merge
 *
 * Governed by:
 * - docs/IMPORT_SPEC.md (§§3 – 10, 13 – 17)
 * - docs/DATA_MODEL.md (§2)
 *
 * One unified pipeline for Vocabulary and Kanji: raw text (paste / .txt / .csv / .md) or rows
 * from .xlsx → delimiter detection → header detection & 4-field mapping → normalization →
 * duplicate removal and safe merge → completeness warnings → StudyItem drafts.
 * Pure functions only; nothing here invents readings or meanings.
 */

import { StudyItem } from '../types';
import { getDeduplicationKey, normalizeJapanese, normalizeVietnamese } from './textNormalization';

export type Delimiter = '\t' | ';' | '|' | ',';
export type DelimiterChoice = 'auto' | 'tab' | 'semicolon' | 'pipe' | 'comma' | 'custom';

export const DELIMITER_BY_CHOICE: Record<Exclude<DelimiterChoice, 'auto' | 'custom'>, Delimiter> = {
  tab: '\t',
  semicolon: ';',
  pipe: '|',
  comma: ',',
};

/** Auto-detection preference order (IMPORT_SPEC §6.2): Tab, Semicolon, Pipe, Comma. */
const AUTO_DELIMITERS: Delimiter[] = ['\t', ';', '|', ','];

export type ImportField = 'japanese' | 'kana' | 'hanViet' | 'vietnamese';
export const IMPORT_FIELDS: ImportField[] = ['japanese', 'kana', 'hanViet', 'vietnamese'];

/** Column index per field; -1 when the field is not mapped. */
export type ColumnMapping = Record<ImportField, number>;

export const POSITIONAL_MAPPING: ColumnMapping = { japanese: 0, kana: 1, hanViet: 2, vietnamese: 3 };

/* ==========================================================================
   Raw text → rows
   ========================================================================== */

/** Splits text into lines, handling \r\n, and drops a UTF-8 BOM. */
function toLines(text: string): string[] {
  return text.replace(/^﻿/, '').split(/\r\n|\n|\r/);
}

/** RFC 4180 parsing for one delimiter: quoted fields may contain delimiters, "" and line breaks. */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const source = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let fieldStart = true;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"' && fieldStart) {
      inQuotes = true;
      fieldStart = false;
      continue;
    }
    if (source.startsWith(delimiter, i)) {
      row.push(field);
      field = '';
      fieldStart = true;
      i += delimiter.length - 1;
      continue;
    }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      fieldStart = true;
      continue;
    }
    field += char;
    fieldStart = false;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const MARKDOWN_SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

/** True when the text looks like a Markdown table (pipe rows with a separator row). */
export function isMarkdownTable(text: string): boolean {
  const lines = toLines(text);
  return (
    lines.some((line) => MARKDOWN_SEPARATOR.test(line) && line.includes('|')) &&
    lines.some((line) => line.includes('|') && !MARKDOWN_SEPARATOR.test(line))
  );
}

/** Markdown tables: strips outer pipes and ignores separator rows (IMPORT_SPEC §8). */
export function parseMarkdownTable(text: string): string[][] {
  return toLines(text)
    .filter((line) => line.trim() !== '' && !MARKDOWN_SEPARATOR.test(line))
    .filter((line) => line.includes('|'))
    .map((line) => {
      let trimmed = line.trim();
      if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
      if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
      return trimmed.split('|').map((cell) => cell.trim());
    });
}

function isBlankRow(row: string[]): boolean {
  return row.every((cell) => cell.trim() === '');
}

/**
 * Auto-detects the delimiter from the first 10 non-empty lines: a delimiter qualifies only when it
 * splits every sampled line into the same number (≥ 2) of columns. Preference: Tab, ;, |, comma.
 */
export function detectDelimiter(text: string): Delimiter | null {
  const sample = toLines(text)
    .filter((line) => line.trim() !== '')
    .slice(0, 10)
    .join('\n');
  if (!sample) return null;

  let fallback: { delimiter: Delimiter; columns: number } | null = null;
  for (const delimiter of AUTO_DELIMITERS) {
    const rows = parseDelimited(sample, delimiter).filter((row) => !isBlankRow(row));
    if (rows.length === 0) continue;
    const counts = rows.map((row) => row.length);
    const first = counts[0];
    if (first >= 2 && counts.every((count) => count === first)) return delimiter;
    // Remember the most consistent multi-column split for ragged input
    const maxColumns = Math.max(...counts);
    if (maxColumns >= 2 && (!fallback || maxColumns > fallback.columns) && delimiter !== ',') {
      fallback = { delimiter, columns: maxColumns };
    }
  }
  return fallback?.delimiter ?? null;
}

export interface ParseTextOptions {
  delimiter: DelimiterChoice;
  customDelimiter?: string;
}

/** Converts raw text into trimmed rows (blank rows removed). */
export function parseTextToRows(text: string, options: ParseTextOptions): string[][] {
  let rows: string[][];
  if (options.delimiter === 'auto' && isMarkdownTable(text)) {
    rows = parseMarkdownTable(text);
  } else {
    let delimiter: string | null;
    if (options.delimiter === 'auto') delimiter = detectDelimiter(text);
    else if (options.delimiter === 'custom') delimiter = options.customDelimiter || null;
    else delimiter = DELIMITER_BY_CHOICE[options.delimiter];

    rows = delimiter
      ? parseDelimited(text, delimiter)
      : toLines(text).map((line) => [line]); // single column: Japanese only
  }
  return rows.map((row) => row.map((cell) => cell.trim())).filter((row) => !isBlankRow(row));
}

/* ==========================================================================
   Header detection & mapping
   ========================================================================== */

/** Lowercase, diacritic-free, whitespace-collapsed form for header alias matching. */
export function foldHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const HEADER_ALIASES: Record<ImportField, string[]> = {
  japanese: ['Từ vựng', 'Tu vung', 'Japanese', 'Word', 'Kanji', '日本語', '単語'],
  kana: ['Cách đọc', 'Cach doc', 'Kana', 'Hiragana', 'Reading', 'ひらがな', 'かな'],
  hanViet: ['Âm Hán Việt', 'Hán Việt', 'Han Viet', 'Am Han Viet', 'Hán tự'],
  vietnamese: ['Nghĩa tiếng Việt', 'Nghĩa', 'Nghia', 'Vietnamese', 'Meaning', 'Ý nghĩa'],
};

const FOLDED_ALIASES: Record<ImportField, string[]> = Object.fromEntries(
  IMPORT_FIELDS.map((field) => [field, HEADER_ALIASES[field].map(foldHeader)])
) as Record<ImportField, string[]>;

export function matchHeaderField(cell: string): ImportField | null {
  const folded = foldHeader(cell);
  if (!folded) return null;
  for (const field of IMPORT_FIELDS) {
    if (FOLDED_ALIASES[field].includes(folded)) return field;
  }
  return null;
}

export interface HeaderDetection {
  hasHeader: boolean;
  mapping: ColumnMapping;
}

/**
 * A first row matching at least 2 known aliases is a header (IMPORT_SPEC §7.1); otherwise the
 * positional order Japanese, Kana, Hán Việt, Vietnamese applies (§7.2).
 */
export function detectHeader(rows: string[][]): HeaderDetection {
  const first = rows[0];
  if (first) {
    const mapping: ColumnMapping = { japanese: -1, kana: -1, hanViet: -1, vietnamese: -1 };
    let matches = 0;
    first.forEach((cell, index) => {
      const field = matchHeaderField(cell);
      if (field && mapping[field] === -1) {
        mapping[field] = index;
        matches++;
      }
    });
    if (matches >= 2) return { hasHeader: true, mapping };
  }
  const columnCount = Math.max(0, ...rows.map((row) => row.length));
  const mapping: ColumnMapping = { ...POSITIONAL_MAPPING };
  for (const field of IMPORT_FIELDS) {
    if (mapping[field] >= columnCount) mapping[field] = -1;
  }
  return { hasHeader: false, mapping };
}

/**
 * Mapping confirmation (SCREEN 22) is needed when auto-detection is not high-confidence:
 * no recognized header row with a Japanese column.
 */
export function needsMappingConfirmation(detection: HeaderDetection): boolean {
  return !detection.hasHeader || detection.mapping.japanese === -1;
}

/* ==========================================================================
   Rows → normalized drafts with duplicate handling
   ========================================================================== */

export type ImportWarning = 'noKana' | 'noMeaning' | 'conflict';

export interface ImportDraftItem {
  japanese: string;
  kana?: string;
  hanViet?: string;
  vietnamese: string[];
  warnings: ImportWarning[];
  /** 1-based source row numbers merged into this item. */
  sourceRows: number[];
}

export interface ImportSummary {
  items: ImportDraftItem[];
  totalRows: number;
  /** Rows without a Japanese expression (blocking; ignored). */
  invalidRows: number;
  /** Exact duplicate rows removed. */
  duplicateRows: number;
  /** Items that received complementary fields from a duplicate row. */
  mergedItems: number;
  /** Items where duplicates disagreed; the first entry was kept. */
  conflictItems: number;
  /** Items with a missing reading or meaning (non-blocking). */
  warningItems: number;
}

/** Splits a meaning cell into accepted definitions ("Du lịch, chuyến đi" → 2 entries). */
export function splitMeanings(value: string): string[] {
  return value
    .split(/[,;、，；\n]/)
    .map((part) => normalizeVietnamese(part))
    .filter((part) => part !== '');
}

function cell(row: string[], index: number): string {
  return index >= 0 && index < row.length ? row[index] : '';
}

function sameMeanings(a: string[], b: string[]): boolean {
  const norm = (list: string[]) => list.map((x) => normalizeVietnamese(x).toLowerCase());
  const x = norm(a);
  const y = norm(b);
  return x.length === y.length && x.every((value, i) => value === y[i]);
}

/**
 * Builds normalized draft items from mapped rows:
 * - exact duplicates (same key, same fields) are dropped;
 * - complementary duplicates fill empty fields of the first item (safe merge);
 * - conflicting duplicates keep the first item and flag a conflict (never overwrite blindly).
 * Dedup key: normalized(japanese) + '::' + normalized(kana || '').
 */
export function buildImportItems(rows: string[][], mapping: ColumnMapping, hasHeader: boolean): ImportSummary {
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const byKey = new Map<string, ImportDraftItem>();
  const order: string[] = [];
  let invalidRows = 0;
  let duplicateRows = 0;
  const merged = new Set<string>();
  const conflicts = new Set<string>();

  dataRows.forEach((row, index) => {
    const rowNumber = index + 1 + (hasHeader ? 1 : 0);
    const japanese = normalizeJapanese(cell(row, mapping.japanese));
    if (!japanese) {
      invalidRows++;
      return;
    }
    const kana = normalizeJapanese(cell(row, mapping.kana)) || undefined;
    const hanViet = normalizeVietnamese(cell(row, mapping.hanViet)) || undefined;
    const vietnamese = splitMeanings(cell(row, mapping.vietnamese));
    const key = getDeduplicationKey(japanese, kana);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, { japanese, kana, hanViet, vietnamese, warnings: [], sourceRows: [rowNumber] });
      order.push(key);
      return;
    }

    const hanVietConflict =
      !!existing.hanViet && !!hanViet && existing.hanViet.toLowerCase() !== hanViet.toLowerCase();
    const meaningConflict =
      existing.vietnamese.length > 0 && vietnamese.length > 0 && !sameMeanings(existing.vietnamese, vietnamese);

    if (hanVietConflict || meaningConflict) {
      conflicts.add(key);
      existing.sourceRows.push(rowNumber);
      return;
    }

    let addedInfo = false;
    if (!existing.hanViet && hanViet) {
      existing.hanViet = hanViet;
      addedInfo = true;
    }
    if (existing.vietnamese.length === 0 && vietnamese.length > 0) {
      existing.vietnamese = vietnamese;
      addedInfo = true;
    }
    existing.sourceRows.push(rowNumber);
    if (addedInfo) merged.add(key);
    else duplicateRows++;
  });

  const items = order.map((key) => {
    const item = byKey.get(key)!;
    const warnings: ImportWarning[] = [];
    if (!item.kana) warnings.push('noKana');
    if (item.vietnamese.length === 0) warnings.push('noMeaning');
    if (conflicts.has(key)) warnings.push('conflict');
    return { ...item, warnings };
  });

  return {
    items,
    totalRows: dataRows.length,
    invalidRows,
    duplicateRows,
    mergedItems: merged.size,
    conflictItems: conflicts.size,
    warningItems: items.filter((item) => item.warnings.some((w) => w === 'noKana' || w === 'noMeaning')).length,
  };
}

/** Draft → StudyItem fields (the ID is assigned when the lesson is created). */
export function toStudyItemFields(draft: ImportDraftItem): Omit<StudyItem, 'id'> {
  const item: Omit<StudyItem, 'id'> = { japanese: draft.japanese, vietnamese: [...draft.vietnamese] };
  if (draft.kana) item.kana = draft.kana;
  if (draft.hanViet) item.hanViet = draft.hanViet;
  return item;
}

/* ==========================================================================
   Files & templates
   ========================================================================== */

export type ImportFileKind = 'text' | 'xlsx';

/** Supported import files: .txt, .csv, .md (text) and .xlsx (IMPORT_SPEC §5.2). */
export function getImportFileKind(fileName: string): ImportFileKind | null {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (extension === 'txt' || extension === 'csv' || extension === 'md') return 'text';
  if (extension === 'xlsx') return 'xlsx';
  return null;
}

export const IMPORT_FILE_ACCEPT =
  '.txt,.csv,.md,.xlsx,text/plain,text/csv,text/markdown,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Header + sample rows shared by every template (IMPORT_SPEC §14). */
export const TEMPLATE_ROWS: string[][] = [
  ['Từ vựng', 'Cách đọc', 'Âm Hán Việt', 'Nghĩa tiếng Việt'],
  ['日本を訪れる', 'にほんをおとずれる', 'Nhật Bản Phỏng', 'Đến thăm Nhật Bản'],
  ['旅行', 'りょこう', 'Lữ Hành', 'Du lịch, chuyến đi'],
  ['ファストフード', 'ふぁすとふーど', '', 'Đồ ăn nhanh'],
];

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildTemplate(kind: 'txt' | 'csv' | 'md'): string {
  if (kind === 'txt') return TEMPLATE_ROWS.map((row) => row.join(';')).join('\n') + '\n';
  if (kind === 'csv') return TEMPLATE_ROWS.map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
  const [header, ...body] = TEMPLATE_ROWS;
  const line = (row: string[]) => `|${row.map((value) => (value ? ` ${value} ` : ' ')).join('|')}|`;
  return [line(header), '|---|---|---|---|', ...body.map(line)].join('\n') + '\n';
}
