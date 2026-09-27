import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { AppStateProvider } from '../../hooks/useAppState';
import { AppTheme, UserStudyState } from '../../types';
import { MeoEdgeAmbience, ThemeAmbience } from '../ThemeAmbience';

function withTheme(theme: AppTheme, node: React.ReactNode): string {
  const state: UserStudyState = {
    version: 1,
    preferences: { theme, language: 'vi', soundEnabled: false },
    books: {},
    lessons: {},
    progressByItem: {},
    recentResults: [],
  };
  return renderToString(<AppStateProvider initialState={state}>{node}</AppStateProvider>);
}

describe("Meo's World ambience", () => {
  it('adds a full cat scene (layered motifs, no repeated logo) to the theme ambience', () => {
    const html = withTheme('meo', <ThemeAmbience />);
    expect(html).toContain('ambience-scene ambience-meo');
    for (const motif of ['meo-loaf', 'meo-peek', 'meo-tail', 'meo-trail', 'meo-fish', 'meo-yarn', 'meo-blob-1']) {
      expect(html, motif).toContain(motif);
    }
    // Derived motif language, never the wordmark image tiled as wallpaper
    expect(html).not.toContain('tango-wordmark');
    expect(html).not.toContain('<img');
    // The standard scenes are still present for the other themes
    for (const scene of ['ambience-light', 'ambience-dark', 'ambience-sakura']) expect(html).toContain(scene);
  });

  it('renders the quiet edge layer only in Meo\'s World, decorative and without busy motifs', () => {
    for (const theme of ['light', 'dark', 'sakura'] as const) {
      expect(withTheme(theme, <MeoEdgeAmbience />), theme).toBe('');
    }
    const html = withTheme('meo', <MeoEdgeAmbience />);
    expect(html).toMatch(/<div aria-hidden="true" class="tango-ambience tango-ambience-quiet">/);
    expect(html).not.toContain('tango-ambience-wide-only');
    expect(withTheme('meo', <MeoEdgeAmbience wideOnly />)).toContain('tango-ambience-wide-only');
  });
});
