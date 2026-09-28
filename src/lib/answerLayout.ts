/**
 * Tango — Answer layout decision (DESIGN_SYSTEM §12.4, QUIZ_SESSION_SCREENS SCREEN 10).
 *
 * The saved preference is the *requested* layout. The *effective* layout of one question is Grid
 * only when the question has exactly four options and every one of them fits a 2×2 answer card
 * comfortably; otherwise the whole question is stacked. The fallback is per question and never
 * changes the saved preference.
 *
 * Layout measurement of the real rendered text is authoritative (see `AnswerChoices`). The script-
 * aware estimate below is only used before that measurement exists (server render and the first
 * client pass, which is replaced before paint).
 */
import { AnswerLayout } from '../types';

/** The grid is designed for exactly four options; any other count stays stacked. */
export const GRID_OPTION_COUNT = 4;

/** The most lines a UI-language (Vietnamese/English) answer may take in a grid card. */
export const GRID_MAX_LINES = 2;

/**
 * Japanese answers are single words with no spaces, so any wrap splits the word itself (e.g. one
 * stray katakana on its own line); in the grid they must fit on one line.
 */
export const GRID_MAX_LINES_JAPANESE = 1;

/** Line limit of a grid answer card for the answer's script. */
export function gridMaxLines(japanese: boolean): number {
  return japanese ? GRID_MAX_LINES_JAPANESE : GRID_MAX_LINES;
}

/** Narrowest readable text column (px) inside a grid answer card; narrower screens stay stacked. */
export const GRID_MIN_TEXT_WIDTH = 96;

/** Text column (px) of a grid answer card on a 360px phone, used by the pre-measurement estimate. */
export const GRID_ESTIMATE_TEXT_WIDTH = 108;

export interface AnswerTextMeasurement {
  /** Rendered line count of the answer text at the grid card width. */
  lines: number;
  /** True when an unbreakable word is wider than the card (it would have to break mid-word). */
  overflows: boolean;
}

export interface AnswerGridMeasurement {
  /** Width (px) of the text column inside one grid answer card. */
  textWidth: number;
  answers: AnswerTextMeasurement[];
}

/** True when every answer fits a grid card comfortably and the card is wide enough to read. */
export function answersFitGrid(measurement: AnswerGridMeasurement, maxLines: number = GRID_MAX_LINES): boolean {
  if (!(measurement.textWidth >= GRID_MIN_TEXT_WIDTH)) return false;
  if (measurement.answers.length !== GRID_OPTION_COUNT) return false;
  return measurement.answers.every((answer) => answer.lines <= maxLines && !answer.overflows);
}

/** Effective layout of one question from the saved preference and whether its answers fit. */
export function resolveAnswerLayout(requested: AnswerLayout, optionCount: number, fitsGrid: boolean): AnswerLayout {
  if (requested !== 'grid' || optionCount !== GRID_OPTION_COUNT) return 'stacked';
  return fitsGrid ? 'grid' : 'stacked';
}

/** Full-width glyphs: kana, CJK ideographs and punctuation, full-width forms. */
const WIDE_RANGES = '\u2E80-\u303F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFF60\uFFE0-\uFFE6';
const WIDE_CHAR = new RegExp(`[${WIDE_RANGES}]`);
/** A full-width character, a run of other non-space characters, or whitespace. */
const TOKEN = new RegExp(`[${WIDE_RANGES}]|[^\\s${WIDE_RANGES}]+|\\s+`, 'g');

/** Approximate advance of one character, in em, for the UI and Japanese font stacks. */
function charWidthEm(char: string): number {
  if (WIDE_CHAR.test(char)) return 1;
  if (char === ' ') return 0.28;
  if (/[A-ZĐ]/.test(char) || /[mwMW]/.test(char)) return 0.72;
  if (/[iljtf.,:;'!|()]/.test(char)) return 0.32;
  return 0.56;
}

/**
 * Estimates one answer's lines at a text column width with greedy line breaking: spaces separate
 * words, and each full-width character is its own break opportunity (Japanese wraps anywhere).
 */
export function estimateAnswerText(text: string, japanese: boolean, textWidth: number): AnswerTextMeasurement {
  // text-xl Japanese answers, text-lg UI-language answers (the mobile sizes)
  const fontSize = japanese ? 20 : 18;
  const tokens = text.trim().match(TOKEN) ?? [];
  const width = (token: string) => Array.from(token).reduce((sum, char) => sum + charWidthEm(char), 0) * fontSize;
  let lines = 1;
  let lineWidth = 0;
  let overflows = false;
  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      if (lineWidth > 0) lineWidth += width(' ');
      continue;
    }
    const tokenWidth = width(token);
    if (tokenWidth > textWidth) overflows = true;
    if (lineWidth > 0 && lineWidth + tokenWidth > textWidth) {
      lines += 1;
      lineWidth = tokenWidth;
    } else {
      lineWidth += tokenWidth;
    }
  }
  return { lines, overflows };
}

/** Pre-measurement estimate of whether four answers fit the grid on a narrow phone. */
export function estimateAnswersFitGrid(options: readonly string[], japanese: boolean): boolean {
  return answersFitGrid(
    {
      textWidth: GRID_ESTIMATE_TEXT_WIDTH,
      answers: options.map((option) => estimateAnswerText(option, japanese, GRID_ESTIMATE_TEXT_WIDTH)),
    },
    gridMaxLines(japanese)
  );
}
