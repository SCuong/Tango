import { readFileSync } from 'fs';
import { resolve } from 'path';
import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { AppStateProvider } from '../../hooks/useAppState';
import { AppTheme, UserStudyState } from '../../types';
import { MeoEdgeAmbience, MeoHomeStage, ThemeAmbience } from '../ThemeAmbience';

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

const catImages = (html: string) => Array.from(html.matchAll(/<img[^>]*data-meo-cat="(\w+)"[^>]*>/g), (m) => [m[1], m[0]]);

describe("Meo's World ambience", () => {
  it('builds the fixed layer from far washes, a paw trail, grass, and two mascot cats at the edges', () => {
    const html = withTheme('meo', <ThemeAmbience />);
    expect(html).toContain('ambience-scene ambience-meo');
    for (const motif of ['meo-wash-1', 'meo-wash-2', 'meo-trail', 'meo-grass-edge', 'meo-cat-peek', 'meo-cat-sleep']) {
      expect(html, motif).toContain(motif);
    }
    // Only the mascot artworks, once each; the yarn centerpiece lives in the Home stage
    expect(catImages(html).map(([kind]) => kind)).toEqual(['peek', 'sleep']);
    // The old hand-drawn SVG cats and the wordmark wallpaper are gone
    for (const old of ['meo-sleeper', 'meo-tail', 'meo-fish', 'meo-blob', 'tango-wordmark']) {
      expect(html, old).not.toContain(old);
    }
    // The standard scenes are still present for the other themes
    for (const scene of ['ambience-light', 'ambience-dark', 'ambience-sakura']) expect(html).toContain(scene);
  });

  it('loads the mascot artwork lazily as decorative, non-draggable images with intrinsic sizes', () => {
    for (const [kind, tag] of catImages(withTheme('meo', <MeoHomeStage />))) {
      expect(tag, kind).toContain('alt=""');
      expect(tag, kind).toContain('loading="lazy"');
      expect(tag, kind).toContain('draggable="false"');
      expect(tag, kind).toMatch(/width="\d+" height="\d+"/);
      expect(tag, kind).toMatch(new RegExp(`src="[^"]*meo-${kind}[^"]*\\.webp"`));
    }
  });

  it('renders the quiet edge layer only in Meo\'s World', () => {
    for (const theme of ['light', 'dark', 'sakura'] as const) {
      expect(withTheme(theme, <MeoEdgeAmbience />), theme).toBe('');
    }
    const html = withTheme('meo', <MeoEdgeAmbience />);
    expect(html).toMatch(/<div aria-hidden="true" class="tango-ambience tango-ambience-quiet">/);
    expect(html).not.toContain('tango-ambience-wide-only');
    expect(withTheme('meo', <MeoEdgeAmbience wideOnly />)).toContain('tango-ambience-wide-only');
  });
});

describe("Meo's World Home stage", () => {
  it('renders only in Meo\'s World', () => {
    for (const theme of ['light', 'dark', 'sakura'] as const) {
      expect(withTheme(theme, <MeoHomeStage />), theme).toBe('');
    }
  });

  it('holds the yarn-playing centerpiece with the peeking and sleeping cats and small ground details', () => {
    const html = withTheme('meo', <MeoHomeStage />);
    expect(html).toMatch(/^<div aria-hidden="true" class="meo-stage">/);
    expect(catImages(html).map(([kind]) => kind)).toEqual(['peek', 'yarn', 'sleep']);
    for (const detail of ['meo-stage-hill', 'meo-stage-thread', 'meo-stage-grass-1', 'meo-stage-flowers', 'meo-stage-heart-1', 'meo-stage-butterfly']) {
      expect(html, detail).toContain(detail);
    }
    // Only the small butterfly and one heart move; both honor reduced motion
    expect(html.match(/ambience-animated/g)).toHaveLength(2);
  });

  it('keeps the stage cats whole: no clipping, and only the wide layout moves the edge cats out', () => {
    const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf-8');
    const stage = css.match(/\.meo-stage\s*\{[^}]*\}/);
    expect(stage).not.toBeNull();
    expect(stage![0]).not.toMatch(/overflow:\s*hidden/);
    expect(stage![0]).toContain('pointer-events: none');
    expect(css).toMatch(/@media \(min-width: 1280px\)\s*\{\s*\.meo-stage \{[^}]*\}\s*\.meo-stage-peek,\s*\.meo-stage-sleep\s*\{\s*display:\s*none;/);
  });
});
