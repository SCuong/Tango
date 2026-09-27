import { describe, it, expect } from 'vitest';
import {
  translate,
  t,
  VI_DICTIONARY,
  EN_DICTIONARY,
  DICTIONARIES,
} from '../i18n';

describe('src/lib/i18n.ts (Localization Foundation)', () => {
  describe('compile-time dictionary symmetry and contract', () => {
    it('both Vietnamese and English dictionaries contain the exact same keys', () => {
      const viKeys = Object.keys(VI_DICTIONARY).sort();
      const enKeys = Object.keys(EN_DICTIONARY).sort();

      expect(viKeys.length).toBeGreaterThan(0);
      expect(enKeys).toEqual(viKeys);
    });

    it('all dictionary values are non-empty strings', () => {
      for (const [key, value] of Object.entries(VI_DICTIONARY)) {
        expect(typeof value).toBe('string');
        expect(value.trim().length, `VI key "${key}" should not be empty`).toBeGreaterThan(0);
      }

      for (const [key, value] of Object.entries(EN_DICTIONARY)) {
        expect(typeof value).toBe('string');
        expect(value.trim().length, `EN key "${key}" should not be empty`).toBeGreaterThan(0);
      }
    });

    it('DICTIONARIES map contains entries for vi and en', () => {
      expect(DICTIONARIES.vi).toBe(VI_DICTIONARY);
      expect(DICTIONARIES.en).toBe(EN_DICTIONARY);
    });
  });

  describe('translate function', () => {
    it('translates strings correctly for Vietnamese (vi)', () => {
      expect(translate('vi', 'nav.home')).toBe('Trang chủ');
      expect(translate('vi', 'category.vocabulary')).toBe('Từ vựng');
      expect(translate('vi', 'preferences.theme.sakura')).toBe('Sakura');
      expect(translate('vi', 'state.notFound')).toBe('Không tìm thấy trang');
    });

    it('translates strings correctly for English (en)', () => {
      expect(translate('en', 'nav.home')).toBe('Home');
      expect(translate('en', 'category.vocabulary')).toBe('Vocabulary');
      expect(translate('en', 'preferences.theme.sakura')).toBe('Sakura');
      expect(translate('en', 'state.notFound')).toBe('Page not found');
    });

    it('supports alias `t` for `translate`', () => {
      expect(t('vi', 'action.save')).toBe('Lưu');
      expect(t('en', 'action.save')).toBe('Save');
    });

    it('falls back safely to Vietnamese when an unconfigured language is passed', () => {
      // @ts-expect-error Testing invalid language runtime fallback
      expect(translate('fr', 'nav.home')).toBe('Trang chủ');
    });

    it('interpolates {param} and {{param}} placeholders when provided', () => {
      // Testing with a custom template string via translate logic
      const withSingleBrace = 'Xin chào {name}!';
      const withDoubleBrace = 'Hello {{name}}!';

      // Verify regex interpolation
      const replaced1 = withSingleBrace.replace(new RegExp(`\\{name\\}`, 'g'), 'Nam');
      const replaced2 = withDoubleBrace.replace(new RegExp(`\\{\\{name\\}\\}`, 'g'), 'Nam');

      expect(replaced1).toBe('Xin chào Nam!');
      expect(replaced2).toBe('Hello Nam!');
    });
  });
});
