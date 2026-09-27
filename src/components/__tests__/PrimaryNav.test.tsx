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
} from '../PrimaryNav';

function state(language: AppLanguage): UserStudyState {
  return {
    version: 1,
    preferences: { theme: 'light', language, soundEnabled: false },
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
    }
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
