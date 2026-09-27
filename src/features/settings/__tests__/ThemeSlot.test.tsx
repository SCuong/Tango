import { readFileSync } from 'fs';
import { resolve } from 'path';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { AppStateProvider } from '../../../hooks/useAppState';
import { NavigationProvider } from '../../../hooks/useNavigation';
import { AppLanguage, AppTheme, UserStudyState } from '../../../types';
import { SettingsScreen, ThemePicker, initialMeoRevealed, slotThemes } from '../SettingsScreen';

function makeState(theme: AppTheme, language: AppLanguage): UserStudyState {
  return {
    version: 1,
    preferences: { theme, language, soundEnabled: false },
    books: {},
    lessons: {},
    progressByItem: {},
    recentResults: [],
  };
}

function renderSettings(theme: AppTheme, language: AppLanguage = 'vi'): string {
  return renderToString(
    <AppStateProvider initialState={makeState(theme, language)}>
      <NavigationProvider initialPath="/settings">
        <SettingsScreen />
      </NavigationProvider>
    </AppStateProvider>
  );
}

/** The picker in a given reveal state (the state the More / Back action toggles). */
function renderPicker(value: AppTheme, revealed: boolean, language: AppLanguage = 'vi', onChange = vi.fn()): string {
  return renderToString(
    <AppStateProvider initialState={makeState(value, language)}>
      <ThemePicker value={value} onChange={onChange} initialRevealed={revealed} />
    </AppStateProvider>
  );
}

function cardTag(html: string, theme: AppTheme): string {
  const match = html.match(new RegExp(`<button[^>]*data-theme-option="${theme}"[^>]*>`));
  expect(match, theme).not.toBeNull();
  return match![0];
}

function revealAction(html: string): string {
  const match = html.match(/<button[^>]*data-theme-reveal="(more|back)"[^>]*>(?:(?!<\/button>).)*<\/button>/);
  expect(match).not.toBeNull();
  return match![0];
}

const slotItems = (html: string) => Array.from(html.matchAll(/class="theme-slot-item" data-slot="(\w+)"/g), (m) => m[1]);

describe('theme slot model', () => {
  it('keeps Light and Dark fixed and swaps only the third slot', () => {
    expect(slotThemes(false)).toEqual(['light', 'dark', 'sakura']);
    expect(slotThemes(true)).toEqual(['light', 'dark', 'meo']);
  });

  it('reveals Meo on open only when it is the persisted theme', () => {
    expect(initialMeoRevealed('meo')).toBe(true);
    for (const theme of ['light', 'dark', 'sakura'] as const) expect(initialMeoRevealed(theme)).toBe(false);
  });
});

describe('Settings theme picker (SSR)', () => {
  it('defaults the third slot to Sakura, with a quiet More action in the section header', () => {
    const html = renderSettings('light');
    // Header row: the title and the action on the same row, before the cards
    const title = html.indexOf('id="settings-theme"');
    const action = html.indexOf('data-theme-reveal=');
    expect(title).toBeGreaterThan(-1);
    expect(action).toBeGreaterThan(title);
    expect(action).toBeLessThan(html.indexOf('role="radiogroup" aria-labelledby="settings-theme"'));
    const more = revealAction(html);
    expect(more).toContain('>Xem thêm<');
    expect(more).toContain('aria-label="Xem thêm chủ đề"');
    expect(more).toContain('aria-controls="settings-theme-slot"');
    expect(more).toContain('min-h-touch');
    expect(more).toContain('focus-visible:ring-2');
    expect(more).not.toContain('cta-raised');
    // Sakura shown, Meo resting above the slot (hidden and unfocusable)
    expect(slotItems(html)).toEqual(['shown', 'above']);
    expect(cardTag(html, 'sakura')).toContain('data-offscreen="false"');
    const meo = cardTag(html, 'meo');
    expect(meo).toContain('aria-hidden="true"');
    expect(meo).toContain('tabindex="-1"');
    // The old side arrows and horizontal track are gone
    expect(html).not.toContain('data-carousel-arrow');
    expect(html).not.toContain('theme-carousel');
  });

  it('More reveals Meo in the third slot (Sakura rests below); Back restores Sakura', () => {
    const revealed = renderPicker('light', true);
    expect(slotItems(revealed)).toEqual(['below', 'shown']);
    expect(cardTag(revealed, 'meo')).toContain('data-offscreen="false"');
    expect(cardTag(revealed, 'sakura')).toContain('aria-hidden="true"');
    expect(revealAction(revealed)).toContain('>Quay lại<');

    const restored = renderPicker('light', false);
    expect(slotItems(restored)).toEqual(['shown', 'above']);
    expect(revealAction(restored)).toContain('>Xem thêm<');
  });

  it('keeps Light and Dark present, visible, and outside the slot in both states', () => {
    for (const revealed of [false, true]) {
      const html = renderPicker('dark', revealed);
      const slot = html.indexOf('id="settings-theme-slot"');
      for (const theme of ['light', 'dark'] as const) {
        const tag = cardTag(html, theme);
        expect(tag).toContain('data-offscreen="false"');
        expect(html.indexOf(`data-theme-option="${theme}"`)).toBeLessThan(slot);
      }
    }
  });

  it('never changes the active theme when the preview is toggled', () => {
    for (const value of ['light', 'sakura', 'meo'] as const) {
      for (const revealed of [false, true]) {
        const onChange = vi.fn();
        const html = renderPicker(value, revealed, 'vi', onChange);
        expect(onChange).not.toHaveBeenCalled();
        const checked = Array.from(html.matchAll(/data-theme-option="(\w+)"[^>]*/g))
          .filter((m) => /aria-checked="true"/.test(html.slice(html.lastIndexOf('<button', m.index), m.index! + m[0].length)))
          .map((m) => m[1]);
        expect(checked, `${value} revealed=${revealed}`).toEqual([value]);
      }
    }
  });

  it('opens with Meo visible and a Back action when Meo is the persisted theme', () => {
    const html = renderSettings('meo', 'en');
    expect(slotItems(html)).toEqual(['below', 'shown']);
    const meo = cardTag(html, 'meo');
    expect(meo).toContain('aria-checked="true"');
    expect(meo).toContain('tabindex="0"');
    const back = revealAction(html);
    expect(back).toContain('>Back<');
    expect(back).toContain('aria-label="Back to previous themes"');
  });

  it('uses localized labels: Xem thêm / Quay lại and More / Back', () => {
    expect(revealAction(renderPicker('light', false, 'vi'))).toContain('>Xem thêm<');
    expect(revealAction(renderPicker('light', true, 'vi'))).toContain('>Quay lại<');
    const more = revealAction(renderPicker('light', false, 'en'));
    expect(more).toContain('>More<');
    expect(more).toContain('aria-label="More themes"');
    expect(revealAction(renderPicker('light', true, 'en'))).toContain('>Back<');
  });

  it('names the fourth theme Mèo mập 😺 in Vietnamese and Meo\'s World in English', () => {
    expect(cardTag(renderSettings('meo', 'vi'), 'meo')).toContain('aria-label="Mèo mập 😺"');
    expect(cardTag(renderSettings('meo', 'en'), 'meo')).toContain('aria-label="Meo&#x27;s World"');
  });

  it('renders a genuine Meo preview in its own theme tokens, distinct from the other previews', () => {
    const html = renderSettings('light');
    const start = html.indexOf('data-theme-option="meo"');
    const meoCard = html.slice(start, html.indexOf('</button>', start));
    expect(meoCard).toContain('data-theme="meo"');
    expect(meoCard).toContain('var(--meo-outline)');
    expect(meoCard).toContain('var(--meo-fur)');
    const sakuraStart = html.indexOf('data-theme-option="sakura"');
    const sakuraCard = html.slice(sakuraStart, html.indexOf('</button>', sakuraStart));
    expect(sakuraCard).not.toContain('--meo-');
  });

  it('previews the current shell in every theme: brand top bar, categories, and the 3-item navigation', () => {
    const html = renderSettings('light');
    for (const theme of ['light', 'dark', 'sakura', 'meo'] as const) {
      const start = html.indexOf(`data-theme-option="${theme}"`);
      const card = html.slice(start, html.indexOf('</button>', start));
      expect(card, theme).not.toContain('bg-cta-surface');
      const topbar = card.indexOf('data-mini="topbar"');
      const categories = card.indexOf('data-mini="categories"');
      const nav = card.indexOf('data-mini="nav"');
      expect(topbar, theme).toBeGreaterThan(-1);
      expect(categories, theme).toBeGreaterThan(topbar);
      expect(nav, theme).toBeGreaterThan(categories);
      const navMarkup = card.slice(nav);
      for (const icon of ['tabler-icon-home', 'tabler-icon-cards', 'tabler-icon-settings']) {
        expect(navMarkup, `${theme} ${icon}`).toContain(icon);
      }
    }
  });

  it('keeps the selected-card treatment for every theme card', () => {
    for (const theme of ['light', 'dark', 'sakura', 'meo'] as const) {
      const tag = cardTag(renderSettings(theme), theme);
      expect(tag).toContain('aria-checked="true"');
      expect(tag).toContain('ring-2 ring-primary');
    }
  });
});

describe('theme slot styles', () => {
  const css = readFileSync(resolve(__dirname, '../../../index.css'), 'utf-8');

  it('travels vertically inside the clipped slot: Sakura exits down, Meo enters from above', () => {
    expect(css).toMatch(/\.theme-slot\s*\{[^}]*clip-path:\s*inset\(/);
    expect(css).toMatch(/\.theme-slot-item\s*\{[^}]*grid-area:\s*1 \/ 1;[^}]*transition:\s*transform 320ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
    expect(css).toMatch(/\.theme-slot-item\[data-slot="above"\]\s*\{[^}]*translateY\(-10\d%\)/);
    expect(css).toMatch(/\.theme-slot-item\[data-slot="below"\]\s*\{[^}]*translateY\(10\d%\)/);
  });

  it('swaps instantly without vertical travel under reduced motion', () => {
    const block = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.theme-slot-item\s*\{[\s\S]*?\n  \}\n/);
    expect(block).not.toBeNull();
    expect(block![0]).toContain('transition: none');
    expect(block![0]).toMatch(/data-slot="below"\][\s\S]*transform:\s*none/);
  });
});
