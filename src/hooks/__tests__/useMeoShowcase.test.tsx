import { readFileSync } from 'fs';
import { resolve } from 'path';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AppStateProvider } from '../useAppState';
import { NavigationProvider } from '../useNavigation';
import { AppTheme, UserStudyState } from '../../types';
import { HomeStudyHub } from '../../features/books/HomeStudyHub';
import { MeoShowcaseExitLayer } from '../../components/MeoShowcase';
import {
  SHOWCASE_BLOCKING_SELECTOR,
  SHOWCASE_HOLD_MS,
  SHOWCASE_MOVE_TOLERANCE,
  createLongPressController,
  createShowcaseExitGuard,
  isShowcasePointer,
  isShowcaseTarget,
} from '../useMeoShowcase';

afterEach(() => {
  vi.useRealTimers();
});

function state(theme: AppTheme): UserStudyState {
  return {
    version: 1,
    preferences: { theme, language: 'vi', soundEnabled: false, answerLayout: 'grid' },
    books: {},
    lessons: {},
    progressByItem: {},
    recentResults: [],
  };
}

function renderHome(theme: AppTheme): string {
  return renderToString(
    <AppStateProvider initialState={state(theme)}>
      <NavigationProvider initialPath="/">
        <HomeStudyHub />
      </NavigationProvider>
    </AppStateProvider>
  );
}

describe('showcase long-press timing', () => {
  it('holds for ~550ms with a ~10px movement tolerance', () => {
    expect(SHOWCASE_HOLD_MS).toBeGreaterThanOrEqual(500);
    expect(SHOWCASE_HOLD_MS).toBeLessThanOrEqual(600);
    expect(SHOWCASE_MOVE_TOLERANCE).toBe(10);
  });

  it('does nothing for a press shorter than the threshold', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const press = createLongPressController({ holdMs: SHOWCASE_HOLD_MS, tolerance: 10, onLongPress });
    press.start(20, 300);
    vi.advanceTimersByTime(SHOWCASE_HOLD_MS - 1);
    press.cancel(); // finger lifted
    vi.advanceTimersByTime(1000);
    expect(onLongPress).not.toHaveBeenCalled();
    expect(press.pending).toBe(false);
  });

  it('opens after a valid hold, even with a little finger jitter', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const press = createLongPressController({ holdMs: SHOWCASE_HOLD_MS, tolerance: 10, onLongPress });
    press.start(20, 300);
    expect(press.move(26, 306)).toBe(false); // ~8.5px: still a hold
    vi.advanceTimersByTime(SHOWCASE_HOLD_MS);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(press.pending).toBe(false);
  });

  it('cancels as soon as the pointer moves more than 10px (a scroll never opens it)', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const press = createLongPressController({ holdMs: SHOWCASE_HOLD_MS, tolerance: 10, onLongPress });
    press.start(20, 300);
    vi.advanceTimersByTime(200);
    expect(press.move(20, 289)).toBe(true); // 11px scroll
    vi.advanceTimersByTime(2000);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('restarts cleanly on rapid repeated attempts', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const press = createLongPressController({ holdMs: SHOWCASE_HOLD_MS, tolerance: 10, onLongPress });
    for (let i = 0; i < 5; i++) {
      press.start(20, 300);
      vi.advanceTimersByTime(150);
      press.cancel();
    }
    vi.advanceTimersByTime(2000);
    expect(onLongPress).not.toHaveBeenCalled();
  });
});

describe('showcase eligibility', () => {
  const target = (blocked: boolean) => ({ closest: vi.fn(() => (blocked ? {} : null)) });

  it('starts only on empty, non-interactive canvas', () => {
    expect(isShowcaseTarget(target(false))).toBe(true);
    expect(isShowcaseTarget(target(true))).toBe(false);
    expect(isShowcaseTarget(null)).toBe(false);
    expect(isShowcaseTarget({})).toBe(false);
  });

  it('blocks cards, buttons, links, form controls, the top bar logo, and the bottom nav', () => {
    for (const selector of ['a', 'button', 'input', 'select', 'textarea', '[role="button"]', '.tango-topbar', '.tango-bottom-nav']) {
      expect(SHOWCASE_BLOCKING_SELECTOR.split(', '), selector).toContain(selector);
    }
  });

  it('responds to touch and pen presses only, never to a mouse', () => {
    expect(isShowcasePointer('touch')).toBe(true);
    expect(isShowcasePointer('pen')).toBe(true);
    expect(isShowcasePointer('mouse')).toBe(false);
    expect(isShowcasePointer('touch', false)).toBe(false);
  });

  it('is available only on Meo\'s World Home', () => {
    expect(renderHome('meo')).toMatch(/<div class="min-h-screen bg-page[^"]*" data-meo-showcase-zone="">/);
    for (const theme of ['light', 'dark', 'sakura'] as const) {
      expect(renderHome(theme), theme).not.toContain('data-meo-showcase-zone');
    }
    // Closed by default: no exit layer and no hold indicator
    const html = renderHome('meo');
    expect(html).not.toContain('data-meo-showcase-exit');
    expect(html).not.toContain('tango-showcase-hold');
  });
});

describe('showcase exit', () => {
  it('exits only on a full tap on the exit layer (never the lift of the opening long press)', () => {
    const guard = createShowcaseExitGuard();
    expect(guard.click()).toBe(false);
    guard.pointerDown();
    expect(guard.click()).toBe(true);
    expect(guard.click()).toBe(false);
  });

  it('renders a full-screen layer above the hidden UI and the bottom nav', () => {
    const html = renderToString(
      <AppStateProvider initialState={state('meo')}>
        <MeoShowcaseExitLayer onExit={() => {}} />
      </AppStateProvider>
    );
    expect(html).toMatch(/<div role="button" tabindex="-1" aria-label="Hiện lại giao diện" data-meo-showcase-exit="" class="tango-showcase-exit">/);
    const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf-8');
    const layer = css.match(/\.tango-showcase-exit\s*\{([^}]*)\}/)![1];
    expect(layer).toMatch(/position:\s*fixed/);
    expect(layer).toMatch(/inset:\s*0/);
    const nav = css.match(/\.tango-bottom-nav\s*\{([^}]*)\}/)![1];
    expect(Number(layer.match(/z-index:\s*(\d+)/)![1])).toBeGreaterThan(Number(nav.match(/z-index:\s*(\d+)/)![1]));
  });
});

describe('showcase styles', () => {
  const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf-8');

  it('hides the Home UI and bottom nav so they cannot be pressed, and brings the artwork forward', () => {
    const hidden = css.match(/\[data-meo-showcase\] \[data-meo-showcase-zone\] > header,\s*\[data-meo-showcase\] \[data-meo-showcase-zone\] > main\s*\{([^}]*)\}/);
    expect(hidden).not.toBeNull();
    expect(hidden![1]).toContain('opacity: 0');
    expect(hidden![1]).toContain('translateY(-18px)');
    expect(hidden![1]).toContain('pointer-events: none');
    expect(css).toMatch(/\[data-meo-showcase\] \.tango-bottom-nav\s*\{[^}]*opacity:\s*0;[^}]*pointer-events:\s*none;/);
    expect(css).toMatch(/\[data-meo-showcase\] \.meo-world-art\s*\{\s*transform:\s*scale\(1\.025\);/);
    expect(css).toMatch(/transition: opacity 300ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
  });

  it('suppresses the browser long-press callout only on the Home canvas during a pending hold', () => {
    expect(css).toMatch(/\[data-meo-holding\] \[data-meo-showcase-zone\]\s*\{[^}]*-webkit-touch-callout:\s*none;[^}]*user-select:\s*none;/);
  });

  it('swaps instantly with no movement and no hold indicator under reduced motion', () => {
    const reduced = css.match(/\/\* Meo showcase: an instant swap[\s\S]*?\.tango-showcase-hold\s*\{\s*display:\s*none !important;/);
    expect(reduced).not.toBeNull();
    expect(reduced![0]).toContain('transform: none !important');
    expect(reduced![0]).toContain('transition: none !important');
  });
});
