import { describe, it, expect } from 'vitest';
import {
  convertHalfWidthKatakana,
  normalizeJapanese,
  normalizeKana,
  normalizeVietnamese,
  getDeduplicationKey,
} from '../textNormalization';

describe('textNormalization', () => {
  describe('convertHalfWidthKatakana', () => {
    it('converts single half-width katakana to full-width katakana', () => {
      expect(convertHalfWidthKatakana('ｱｲｳｴｵ')).toBe('アイウエオ');
      expect(convertHalfWidthKatakana('ｶｷｸｹｺ')).toBe('カキクケコ');
      expect(convertHalfWidthKatakana('ｻｼｽｾｿ')).toBe('サシスセソ');
      expect(convertHalfWidthKatakana('ﾀﾁﾂﾃﾄ')).toBe('タチツテト');
      expect(convertHalfWidthKatakana('ﾅﾆﾇﾈﾉ')).toBe('ナニヌネノ');
      expect(convertHalfWidthKatakana('ﾊﾋﾌﾍﾎ')).toBe('ハヒフヘホ');
      expect(convertHalfWidthKatakana('ﾏﾐﾑﾒﾓ')).toBe('マミムメモ');
      expect(convertHalfWidthKatakana('ﾔﾕﾖ')).toBe('ヤユヨ');
      expect(convertHalfWidthKatakana('ﾗﾘﾙﾚﾛ')).toBe('ラリルレロ');
      expect(convertHalfWidthKatakana('ﾜｦﾝ')).toBe('ワヲン');
      expect(convertHalfWidthKatakana('ｧｨｩｪｫｯｬｭｮｰ')).toBe('ァィゥェォッャュョー');
    });

    it('converts voiced (dakuten) half-width katakana combinations', () => {
      expect(convertHalfWidthKatakana('ｶﾞｷﾞｸﾞｹﾞｺﾞ')).toBe('ガギグゲゴ');
      expect(convertHalfWidthKatakana('ｻﾞｼﾞｽﾞｾﾞｿﾞ')).toBe('ザジズゼゾ');
      expect(convertHalfWidthKatakana('ﾀﾞﾁﾞﾂﾞﾃﾞﾄﾞ')).toBe('ダヂヅデド');
      expect(convertHalfWidthKatakana('ﾊﾞﾋﾞﾌﾞﾍﾞﾎﾞ')).toBe('バビブベボ');
      expect(convertHalfWidthKatakana('ｳﾞ')).toBe('ヴ');
    });

    it('converts semi-voiced (handakuten) half-width katakana combinations', () => {
      expect(convertHalfWidthKatakana('ﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ')).toBe('パピプペポ');
    });

    it('handles mixed compounds like fast food', () => {
      expect(convertHalfWidthKatakana('ﾌｧｽﾄﾌｰﾄﾞ')).toBe('ファストフード');
    });

    it('preserves Kanji and Hiragana untouched', () => {
      expect(convertHalfWidthKatakana('旅行 りょこう')).toBe('旅行 りょこう');
    });
  });

  describe('normalizeJapanese', () => {
    it('trims leading/trailing ASCII spaces and full-width Japanese spaces (\\u3000)', () => {
      expect(normalizeJapanese('  \u3000旅行\u3000 ')).toBe('旅行');
    });

    it('collapses internal spaces to single space', () => {
      expect(normalizeJapanese('日本を   \u3000  訪れる')).toBe('日本を 訪れる');
    });

    it('normalizes half-width katakana to full-width and applies NFC', () => {
      expect(normalizeJapanese(' ﾌｧｽﾄﾌｰﾄﾞ ')).toBe('ファストフード');
    });
  });

  describe('normalizeKana', () => {
    it('returns empty string for null, undefined, or empty string', () => {
      expect(normalizeKana(undefined)).toBe('');
      expect(normalizeKana(null)).toBe('');
      expect(normalizeKana('')).toBe('');
      expect(normalizeKana('   ')).toBe('');
    });

    it('normalizes Kana readings with trimming', () => {
      expect(normalizeKana(' \u3000りょこう\u3000 ')).toBe('りょこう');
    });
  });

  describe('normalizeVietnamese', () => {
    it('normalizes decomposed Unicode (NFD) to composed (NFC)', () => {
      const canonical = 'Tiếng Việt';
      const nfd = canonical.normalize('NFD');
      // Verify nfd is actually decomposed into combining marks
      expect(nfd).not.toBe(canonical);
      expect(nfd.length).toBeGreaterThan(canonical.length);
      expect(normalizeVietnamese(nfd)).toBe(canonical);
    });

    it('trims and collapses whitespace', () => {
      expect(normalizeVietnamese('   du    lịch,   chuyến đi   ')).toBe('du lịch, chuyến đi');
    });
  });

  describe('getDeduplicationKey', () => {
    it('generates the authoritative deduplication key matching normalized(japanese) + "::" + normalized(kana || "")', () => {
      expect(getDeduplicationKey(' 旅行 ', ' りょこう ')).toBe('旅行::りょこう');
    });

    it('handles empty or missing kana gracefully', () => {
      expect(getDeduplicationKey('旅行')).toBe('旅行::');
      expect(getDeduplicationKey('旅行', undefined)).toBe('旅行::');
      expect(getDeduplicationKey('旅行', '')).toBe('旅行::');
    });

    it('deduplicates across half-width and full-width katakana variations', () => {
      const key1 = getDeduplicationKey('ﾌｧｽﾄﾌｰﾄﾞ', 'ふぁすとふーど');
      const key2 = getDeduplicationKey('ファストフード', 'ふぁすとふーど');
      expect(key1).toBe(key2);
      expect(key1).toBe('ファストフード::ふぁすとふーど');
    });
  });
});

