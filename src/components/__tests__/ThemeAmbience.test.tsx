import { readFileSync } from 'fs';
import { resolve } from 'path';
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

const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf-8');

describe("Meo's World background artwork", () => {
  it('uses the portrait composition on phones and the wide one from sm, via one <picture>', () => {
    const html = withTheme('meo', <ThemeAmbience />);
    const scene = html.slice(html.indexOf('ambience-scene ambience-meo'));
    const picture = scene.match(/<picture class="meo-world">([\s\S]*?)<\/picture>/);
    expect(picture).not.toBeNull();
    // The browser downloads only the composition it shows
    expect(picture![1]).toMatch(/<source media="\(min-width: 640px\)" srcSet="[^"]*meo-world-desktop[^"]*\.png" width="1048" height="594"\/>/);
    const img = picture![1].match(/<img[^>]*>/)![0];
    expect(img).toMatch(/src="[^"]*meo-world-mobile[^"]*\.png"/);
    expect(img).toContain('width="483"');
    expect(img).toContain('height="845"');
    expect(img).toContain('alt=""');
    expect(img).toContain('loading="lazy"');
    expect(img).toContain('draggable="false"');
    // Exactly one artwork image, and none of the old drawn scene pieces
    expect(html.match(/data-meo-world/g)).toHaveLength(1);
    for (const old of ['meo-stage', 'meo-wash', 'meo-trail', 'meo-grass', 'meo-cat', 'meo-butterfly', 'meo-sleeper', 'tango-wordmark']) {
      expect(html, old).not.toContain(old);
    }
    // The standard scenes are still present for the other themes
    for (const other of ['ambience-light', 'ambience-dark', 'ambience-sakura']) expect(html).toContain(other);
  });

  it('never stretches the artwork: full width on phones, natural proportions capped from sm', () => {
    expect(css).toMatch(/\.meo-world-art\s*\{[^}]*width:\s*100%;[^}]*height:\s*auto;/);
    const wide = css.match(/@media \(min-width: 640px\)\s*\{\s*\.ambience-meo \.meo-world\s*\{[^}]*\}[\s\S]*?\.meo-world-art\s*\{([^}]*)\}/);
    expect(wide).not.toBeNull();
    expect(wide![1]).toContain('width: auto');
    expect(wide![1]).toContain('max-width: 100%');
    expect(wide![1]).toMatch(/max-height:\s*42vh/);
    // Cut side edges are feathered with an alpha mask; the artwork file itself is untouched
    expect(wide![1]).toContain('mask-image: linear-gradient(to right, transparent');
  });

  it('renders the quiet edge layer only in Meo\'s World', () => {
    for (const theme of ['light', 'dark', 'sakura'] as const) {
      expect(withTheme(theme, <MeoEdgeAmbience />), theme).toBe('');
    }
    const html = withTheme('meo', <MeoEdgeAmbience />);
    expect(html).toMatch(/<div aria-hidden="true" class="tango-ambience tango-ambience-quiet">/);
    expect(html).toContain('data-meo-world');
    expect(html).not.toContain('tango-ambience-wide-only');
    expect(withTheme('meo', <MeoEdgeAmbience wideOnly />)).toContain('tango-ambience-wide-only');
  });
});
