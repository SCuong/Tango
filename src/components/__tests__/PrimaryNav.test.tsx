import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { AppStateProvider } from '../../hooks/useAppState';
import { NavigationProvider } from '../../hooks/useNavigation';
import { AppLanguage, UserStudyState } from '../../types';
import { buildPath, parseRoute } from '../../lib/routes';
import {
  MobileBottomNav,
  PRIMARY_DESTINATIONS,
  PrimaryDestination,
  getPrimaryDestination,
  primaryNavTarget,
  shouldAnimateRootEntrance,
} from '../PrimaryNav';

function state(language: AppLanguage): UserStudyState {
  return {
    version: 1,
    preferences: { theme: 'light', language, soundEnabled: false, answerLayout: 'grid', incorrectFeedback: 'popup' },
    books: {},
    lessons: {},
    progressByItem: {},
    recentResults: [],
  };
}

function renderNav(active: PrimaryDestination, language: AppLanguage = 'vi'): string {
  return renderToString(
    <AppStateProvider initialState={state(language)}>
      <NavigationProvider initialPath="/">
        <MobileBottomNav active={active} />
      </NavigationProvider>
    </AppStateProvider>
  );
}

function tabMarkup(html: string, id: PrimaryDestination): string {
  const start = html.indexOf(`data-nav-destination="${id}"`);
  return html.slice(start, html.indexOf('</button>', start));
}

describe('primary destinations', () => {
  it('map Home, Test, and Settings to the existing canonical routes', () => {
    expect(PRIMARY_DESTINATIONS.map((d) => [d.id, buildPath(d.route)])).toEqual([
      ['home', '/'],
      ['test', '/quiz/mixed-config'],
      ['settings', '/settings'],
    ]);
  });

  it('recognizes only the three root routes as primary destinations', () => {
    expect(getPrimaryDestination(parseRoute('/'))).toBe('home');
    expect(getPrimaryDestination(parseRoute('/quiz/mixed-config'))).toBe('test');
    expect(getPrimaryDestination(parseRoute('/settings'))).toBe('settings');

    const deeper = [
      '/book/b1',
      '/book/b1/category/kanji',
      '/learn/vocabulary',
      '/lesson/l1',
      '/lesson/l1/items',
      '/book/b1/quiz-config',
      '/book/b1/category/kanji/quiz-config',
      '/quiz/session',
      '/quiz/results',
      '/quiz/review',
      '/settings/content-management',
      '/settings/content-management/add-book',
      '/settings/content-management/book/b1',
      '/settings/content-management/lesson/l1',
      '/settings/content-management/import',
      '/does-not-exist',
    ];
    for (const path of deeper) {
      expect(getPrimaryDestination(parseRoute(path)), path).toBeNull();
    }
  });
});

describe('tab presses and root transitions', () => {
  it('does not navigate when the current tab is tapped again', () => {
    for (const destination of PRIMARY_DESTINATIONS) {
      expect(primaryNavTarget(destination, true), destination.id).toBeNull();
      expect(primaryNavTarget(destination, false), destination.id).toEqual(destination.route);
    }
  });

  it('animates only switches between two different root destinations', () => {
    const roots: PrimaryDestination[] = ['home', 'test', 'settings'];
    for (const from of roots) {
      for (const to of roots) {
        expect(shouldAnimateRootEntrance(from, to), `${from} -> ${to}`).toBe(from !== to);
      }
      // Leaving to or returning from a deeper route never animates
      expect(shouldAnimateRootEntrance(from, null)).toBe(false);
      expect(shouldAnimateRootEntrance(null, from)).toBe(false);
    }
    expect(shouldAnimateRootEntrance(null, null)).toBe(false);
  });
});

describe('MobileBottomNav', () => {
  it('is a labelled, mobile-only nav with three equal destinations', () => {
    const html = renderNav('home');
    expect(html).toMatch(/<nav aria-label="Điều hướng chính" class="tango-bottom-nav sm:hidden">/);
    const tabs = html.match(/<button[^>]*data-nav-destination="\w+"[^>]*>/g) ?? [];
    expect(tabs).toHaveLength(3);
    for (const tab of tabs) {
      expect(tab).toContain('min-h-touch');
      expect(tab).toContain('flex-1');
      expect(tab).toContain('data-pressed="false"');
      expect(tab).toContain('focus-visible:ring-2');
      // The cell never becomes a pressed slab: no flat pressed background, no tap highlight
      expect(tab).not.toContain('flat-interactive');
      expect(tab).not.toMatch(/class="[^"]*bg-/);
      expect(tab).toContain('tango-nav-tab');
    }
  });

  it('keeps one icon-puck geometry for every tab, active or not', () => {
    const html = renderNav('home');
    const pucks = html.match(/<span[^>]*data-nav-puck=""[^>]*>/g) ?? [];
    expect(pucks).toHaveLength(3);
    for (const puck of pucks) {
      expect(puck).toContain('w-14 h-8 rounded-full border');
      expect(puck).toContain('tango-nav-puck');
    }
    // Only the active puck is filled and raised at rest
    expect(tabMarkup(html, 'home')).toContain('shadow-clay-card');
    expect(tabMarkup(html, 'test')).toContain('border-transparent');
    expect(tabMarkup(html, 'test')).not.toContain('shadow-clay');
  });

  it.each(['home', 'test', 'settings'] as const)('marks only %s as the current page', (active) => {
    const html = renderNav(active);
    const current = Array.from(html.matchAll(/<button[^>]*aria-current="page"[^>]*>/g), (m) => m[0]);
    expect(current).toHaveLength(1);
    expect(current[0]).toContain(`data-nav-destination="${active}"`);
    // Not color alone: the active icon sits on a puck and the label is bold
    const tab = tabMarkup(html, active);
    expect(tab).toContain('bg-primary-surface');
    expect(tab).toContain('font-bold');
  });

  it('uses localized labels in Vietnamese and English', () => {
    const vi = renderNav('home', 'vi');
    expect(vi).toContain('aria-label="Trang chủ"');
    expect(vi).toContain('aria-label="Kiểm tra"');
    expect(vi).toContain('aria-label="Cài đặt"');
    const en = renderNav('home', 'en');
    expect(en).toContain('aria-label="Primary navigation"');
    expect(en).toContain('aria-label="Home"');
    expect(en).toContain('aria-label="Test"');
    expect(en).toContain('aria-label="Settings"');
  });

  it('uses bolder strokes for the active icon than for inactive ones', () => {
    const html = renderNav('test');
    expect(tabMarkup(html, 'test')).toContain('stroke-width="2.7"');
    expect(tabMarkup(html, 'home')).toContain('stroke-width="2.4"');
  });
});
