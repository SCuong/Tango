import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APP_THEMES, isAppTheme } from '../../types';
import { loadPreferences, savePreferences, STORAGE_KEYS } from '../storage';
import { applyDocumentPreferences, mergePreferences } from '../appState';
import { translate } from '../i18n';

const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf-8');

function memoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, String(value)),
    removeItem: (key) => void store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe("Meo's World theme contract", () => {
  beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it('accepts meo as a valid AppTheme next to the three standard themes', () => {
    expect(APP_THEMES).toEqual(['light', 'dark', 'sakura', 'meo']);
    for (const theme of APP_THEMES) expect(isAppTheme(theme)).toBe(true);
    for (const invalid of ['MEO', 'cat', '', null, undefined, 3]) expect(isAppTheme(invalid)).toBe(false);
  });

  it('persists and reloads meo under the existing preferences key', () => {
    savePreferences({ theme: 'meo', language: 'en', soundEnabled: false, answerLayout: 'grid' });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.PREFERENCES)!).theme).toBe('meo');
    expect(loadPreferences()).toEqual({ theme: 'meo', language: 'en', soundEnabled: false, answerLayout: 'grid' });
  });

  it('still falls back to Light for an invalid stored theme', () => {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify({ theme: 'Meo', language: 'vi' }));
    expect(loadPreferences().theme).toBe('light');
  });

  it('merges a meo selection and ignores unknown themes', () => {
    const current = { theme: 'sakura' as const, language: 'vi' as const, soundEnabled: false, answerLayout: 'grid' as const };
    expect(mergePreferences(current, { theme: 'meo' }).theme).toBe('meo');
    // @ts-expect-error Testing invalid runtime values
    expect(mergePreferences(current, { theme: 'tiger' }).theme).toBe('sakura');
  });

  it('applies data-theme="meo" to the document root', () => {
    const root = {
      dataset: {} as Record<string, string>,
      lang: '',
      setAttribute(name: string, value: string) {
        if (name === 'data-theme') this.dataset.theme = value;
      },
    };
    vi.stubGlobal('document', { documentElement: root });
    applyDocumentPreferences({ theme: 'meo', language: 'vi' });
    expect(root.dataset.theme).toBe('meo');
  });

  it('localizes the theme name: Mèo mập 😺 / Meo\'s World', () => {
    expect(translate('vi', 'preferences.theme.meo')).toBe('Mèo mập 😺');
    expect(translate('en', 'preferences.theme.meo')).toBe("Meo's World");
  });
});

describe("Meo's World styles stay scoped", () => {
  it('defines a complete semantic token set, including the mascot palette', () => {
    const block = css.match(/\[data-theme="meo"\]\s*\{([\s\S]*?)\n\}/);
    expect(block).not.toBeNull();
    for (const token of [
      '--bg-page',
      '--bg-surface',
      '--text-primary',
      '--primary',
      '--category-vocabulary-surface',
      '--category-kanji-surface',
      '--cta-surface',
      '--cta-depth',
      '--ambience-line',
      '--shadow-clay-card',
      '--meo-fur',
      '--meo-stripe',
      '--meo-cream',
      '--meo-outline',
    ]) {
      expect(block![1], token).toMatch(new RegExp(`${token}:\\s*[^;]+;`));
    }
  });

  it('only catifies icons, pucks, and the bottom nav under data-theme="meo"', () => {
    for (const selector of [
      '.tabler-icon {',
      '.tango-icon-puck::before',
      '.tango-bottom-nav-bar {',
      '.meo-only {\n    display: inline',
      '.ambience-meo {',
      '.rounded-xl {',
    ]) {
      const index = css.indexOf(selector);
      expect(index, selector).toBeGreaterThan(-1);
      const lineStart = css.lastIndexOf('\n', index);
      expect(css.slice(lineStart, index), selector).toContain('[data-theme="meo"]');
    }
    // Outside Meo's World the accents are hidden and the Light scene excludes the meo theme
    expect(css).toMatch(/\.tango-nav-ear\s*\{\s*display:\s*none;/);
    expect(css).toMatch(/\.meo-only\s*\{\s*display:\s*none;/);
    expect(css).toContain(':not([data-theme="meo"]) .ambience-light');
  });

  it('keeps the Meo background artwork static (nothing to disable under reduced motion)', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.ambience-animated\s*\{\s*animation:\s*none !important;/);
    // The finished background artwork is a still image: no Meo-specific animations at all
    expect(css).not.toMatch(/\.meo-[a-z-]+\s*\{[^}]*animation:/);
    expect(css).not.toMatch(/@keyframes meo-/);
  });
});
