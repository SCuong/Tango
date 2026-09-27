import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { AppStateProvider } from '../../../hooks/useAppState';
import { NavigationProvider } from '../../../hooks/useNavigation';
import { AppLanguage, AppTheme, UserStudyState } from '../../../types';
import { SettingsScreen, carouselPositionFor, visibleThemes } from '../SettingsScreen';

function renderSettings(theme: AppTheme, language: AppLanguage = 'vi'): string {
  const state: UserStudyState = {
    version: 1,
    preferences: { theme, language, soundEnabled: false },
    books: {},
    lessons: {},
    progressByItem: {},
    recentResults: [],
  };
  return renderToString(
    <AppStateProvider initialState={state}>
      <NavigationProvider initialPath="/settings">
        <SettingsScreen />
      </NavigationProvider>
    </AppStateProvider>
  );
}

function cardTag(html: string, theme: AppTheme): string {
  const match = html.match(new RegExp(`<button[^>]*data-theme-option="${theme}"[^>]*>`));
  expect(match, theme).not.toBeNull();
  return match![0];
}

describe('theme carousel positions', () => {
  it('shows exactly the three standard themes first, and shifts by one card to reveal Meo', () => {
    expect(visibleThemes(0)).toEqual(['light', 'dark', 'sakura']);
    expect(visibleThemes(1)).toEqual(['dark', 'sakura', 'meo']);
  });

  it('keeps the selected theme visible, only moving when it would be hidden', () => {
    // Opening Settings: only a persisted Meo's World starts on the second position
    expect(carouselPositionFor('light')).toBe(0);
    expect(carouselPositionFor('dark')).toBe(0);
    expect(carouselPositionFor('sakura')).toBe(0);
    expect(carouselPositionFor('meo')).toBe(1);
    // Choosing Dark or Sakura while Meo's World is revealed does not force the carousel back
    expect(carouselPositionFor('dark', 1)).toBe(1);
    expect(carouselPositionFor('sakura', 1)).toBe(1);
    // Keyboard selection of a hidden theme brings it into view
    expect(carouselPositionFor('light', 1)).toBe(0);
    expect(carouselPositionFor('meo', 0)).toBe(1);
  });
});

describe('Settings theme picker (SSR)', () => {
  it('initially exposes Light / Dark / Sakura with a right arrow; Meo stays hidden', () => {
    const html = renderSettings('light');
    expect(html).toMatch(/role="radiogroup"[^>]*data-position="0"/);
    for (const theme of ['light', 'dark', 'sakura'] as const) {
      expect(cardTag(html, theme)).toContain('data-offscreen="false"');
      expect(cardTag(html, theme)).not.toContain('aria-hidden');
    }
    const meo = cardTag(html, 'meo');
    expect(meo).toContain('data-offscreen="true"');
    expect(meo).toContain('aria-hidden="true"');
    expect(meo).toContain('tabindex="-1"');
    // Roving focus: the selected visible card is the only tabbable radio
    expect(cardTag(html, 'light')).toContain('tabindex="0"');
    // Real button arrow with a localized name, and no spoiler in its label
    expect(html).toMatch(/<button[^>]*aria-label="Xem thêm chủ đề"[^>]*aria-controls="settings-theme-track"[^>]*data-carousel-arrow="right"/);
    expect(html).not.toContain('data-carousel-arrow="left"');
    expect(html).not.toMatch(/bí mật|secret/i);
  });

  it('opens on the second position with a left arrow when Meo is the persisted theme', () => {
    const html = renderSettings('meo', 'en');
    expect(html).toMatch(/role="radiogroup"[^>]*data-position="1"/);
    expect(cardTag(html, 'light')).toContain('data-offscreen="true"');
    const meo = cardTag(html, 'meo');
    expect(meo).toContain('aria-checked="true"');
    expect(meo).toContain('data-offscreen="false"');
    expect(meo).toContain('tabindex="0"');
    expect(html).toMatch(/<button[^>]*aria-label="Previous themes"[^>]*data-carousel-arrow="left"/);
    expect(html).not.toContain('data-carousel-arrow="right"');
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
      // No stale Home CTA bar any more
      expect(card, theme).not.toContain('bg-cta-surface');
      expect(card, theme).not.toContain('--cta-depth');
      // Brand top bar with the cat wordmark, Vocabulary / Kanji cards, then the mini navigation
      const topbar = card.indexOf('data-mini="topbar"');
      const categories = card.indexOf('data-mini="categories"');
      const nav = card.indexOf('data-mini="nav"');
      expect(topbar, theme).toBeGreaterThan(-1);
      expect(categories, theme).toBeGreaterThan(topbar);
      expect(nav, theme).toBeGreaterThan(categories);
      expect(card.slice(topbar, categories)).toMatch(/<img[^>]*alt=""/);
      const navMarkup = card.slice(nav);
      for (const icon of ['tabler-icon-home', 'tabler-icon-cards', 'tabler-icon-settings']) {
        expect(navMarkup, `${theme} ${icon}`).toContain(icon);
      }
      // Home is the active destination in every miniature
      expect(navMarkup).toMatch(/bg-primary-surface text-primary"><svg[^>]*tabler-icon-home/);
    }
  });

  it('keeps both carousel arrows in a reserved gutter beside the card row', () => {
    for (const theme of ['light', 'meo'] as const) {
      const html = renderSettings(theme);
      expect(html).toMatch(/<div class="theme-picker relative -mx-3" data-position="[01]">/);
      const arrow = html.match(/<button[^>]*data-carousel-arrow="(left|right)"[^>]*>/);
      expect(arrow).not.toBeNull();
      expect(arrow![0]).toMatch(arrow![1] === 'right' ? /\bright-0\b/ : /\bleft-0\b/);
      expect(arrow![0]).toContain('w-11 h-11');
      expect(arrow![0]).toContain('focus-visible:ring-2');
    }
  });

  it('keeps the standard selected-card treatment for every theme card', () => {
    for (const theme of ['light', 'dark', 'sakura', 'meo'] as const) {
      const tag = cardTag(renderSettings(theme), theme);
      expect(tag).toContain('aria-checked="true"');
      expect(tag).toContain('ring-2 ring-primary');
    }
  });
});
