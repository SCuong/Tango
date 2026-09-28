import { describe, it, expect } from 'vitest';
import {
  GRID_MAX_LINES,
  GRID_MAX_LINES_JAPANESE,
  GRID_MIN_TEXT_WIDTH,
  answersFitGrid,
  estimateAnswerText,
  estimateAnswersFitGrid,
  gridMaxLines,
  resolveAnswerLayout,
} from '../answerLayout';

const fit = (lines: number[], textWidth = 140, overflows: boolean[] = []) => ({
  textWidth,
  answers: lines.map((count, index) => ({ lines: count, overflows: overflows[index] ?? false })),
});

describe('answer layout decision', () => {
  it('uses the saved preference only for questions with exactly four options', () => {
    expect(resolveAnswerLayout('grid', 4, true)).toBe('grid');
    expect(resolveAnswerLayout('stacked', 4, true)).toBe('stacked');
    // Other option counts keep the safe stacked layout
    expect(resolveAnswerLayout('grid', 3, true)).toBe('stacked');
    expect(resolveAnswerLayout('grid', 5, true)).toBe('stacked');
    expect(resolveAnswerLayout('grid', 0, true)).toBe('stacked');
  });

  it('falls back to stacked for the whole question when any answer does not fit', () => {
    expect(resolveAnswerLayout('grid', 4, false)).toBe('stacked');
  });

  it('fits the grid when every answer takes at most about two lines', () => {
    expect(GRID_MAX_LINES).toBe(2);
    expect(answersFitGrid(fit([1, 1, 1, 1]))).toBe(true);
    expect(answersFitGrid(fit([2, 1, 2, 1]))).toBe(true);
    // One long answer is enough to stack the entire question
    expect(answersFitGrid(fit([1, 3, 1, 1]))).toBe(false);
  });

  it('never splits an unbreakable word to force the grid', () => {
    expect(answersFitGrid(fit([1, 1, 1, 1], 140, [false, false, true, false]))).toBe(false);
  });

  it('keeps Japanese answers on one line in the grid (a wrap would split the word)', () => {
    expect(GRID_MAX_LINES_JAPANESE).toBe(1);
    expect(gridMaxLines(true)).toBe(1);
    expect(gridMaxLines(false)).toBe(2);
    expect(answersFitGrid(fit([1, 2, 1, 1]), gridMaxLines(true))).toBe(false);
    expect(answersFitGrid(fit([1, 1, 1, 1]), gridMaxLines(true))).toBe(true);
  });

  it('stays stacked when the grid cards are too narrow to read', () => {
    expect(answersFitGrid(fit([1, 1, 1, 1], GRID_MIN_TEXT_WIDTH))).toBe(true);
    expect(answersFitGrid(fit([1, 1, 1, 1], GRID_MIN_TEXT_WIDTH - 1))).toBe(false);
    expect(answersFitGrid(fit([1, 1, 1, 1], Number.NaN))).toBe(false);
  });

  it('needs four measured answers', () => {
    expect(answersFitGrid(fit([1, 1, 1]))).toBe(false);
  });
});

describe('pre-measurement estimate', () => {
  it('weighs scripts by visual width rather than character count', () => {
    // Both have seven characters: Vietnamese fits one line, full-width katakana does not
    expect(estimateAnswerText('du lịch', false, 108).lines).toBe(1);
    expect(estimateAnswerText('ファストフード', true, 108).lines).toBeGreaterThan(1);
  });

  it('wraps Vietnamese at spaces and Japanese at any character', () => {
    expect(estimateAnswerText('việc mua sắm hằng ngày', false, 108).lines).toBe(3);
    expect(estimateAnswerText('việc mua sắm hằng ngày', false, 150).lines).toBe(2);
    expect(estimateAnswerText('取扱説明書', true, 108)).toEqual({ lines: 1, overflows: false });
    expect(estimateAnswerText('ネットショッピングサイト', true, 108).overflows).toBe(false);
  });

  it('flags a single word wider than the card', () => {
    expect(estimateAnswerText('internationalization', false, 108).overflows).toBe(true);
  });

  it('estimates short answers into the grid and a long one out of it', () => {
    expect(estimateAnswersFitGrid(['con mèo', 'du lịch', 'thực tế', 'lễ nghi'], false)).toBe(true);
    expect(estimateAnswersFitGrid(['猫', '駅', '会社', '学校'], true)).toBe(true);
    expect(estimateAnswersFitGrid(['con mèo', 'sách hướng dẫn sử dụng sản phẩm chi tiết', 'thực tế', 'lễ nghi'], false)).toBe(false);
    expect(estimateAnswersFitGrid(['猫', 'ネットショッピングサイト', '会社', '学校'], true)).toBe(false);
  });
});
