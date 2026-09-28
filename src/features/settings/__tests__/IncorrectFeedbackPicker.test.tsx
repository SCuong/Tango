import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AppStateProvider, AppStateContextValue, useAppState } from '../../../hooks/useAppState';
import { NavigationProvider } from '../../../hooks/useNavigation';
import { AppLanguage, AppTheme, IncorrectFeedback, UserStudyState } from '../../../types';
import { IncorrectFeedbackPicker, SettingsScreen, applyPreferenceChange } from '../SettingsScreen';
import { previewPickerCards } from './previewPickerHarness';

function makeState(language: AppLanguage = 'vi', incorrectFeedback: IncorrectFeedback = 'popup', theme: AppTheme = 'light'): UserStudyState {
  return {
    version: 1,
    preferences: { theme, language, soundEnabled: false, answerLayout: 'grid', incorrectFeedback },
    books: {},
    lessons: {},
    progressByItem: {},
    recentResults: [],
  };
}

function renderSettings(language: AppLanguage = 'vi', incorrectFeedback: IncorrectFeedback = 'popup', theme: AppTheme = 'light'): string {
  return renderToString(
    <AppStateProvider initialState={makeState(language, incorrectFeedback, theme)}>
      <NavigationProvider initialPath="/settings">
        <SettingsScreen />
      </NavigationProvider>
    </AppStateProvider>
  );
}

function optionTag(html: string, style: IncorrectFeedback): string {
  return html.match(new RegExp(`<button[^>]*data-incorrect-feedback-option="${style}"[^>]*>`))![0];
}

function miniature(html: string, style: IncorrectFeedback): string {
  const start = html.indexOf(`data-mini-feedback="${style}"`);
  return html.slice(start, html.indexOf('</button>', start));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Settings incorrect-answer feedback preview', () => {
  it('shows two preview cards in a radio group after the answer layout', () => {
    const html = renderSettings();
    expect(html.indexOf('Bố cục đáp án')).toBeLessThan(html.indexOf('Hiển thị lời giải khi sai'));
    expect(html.indexOf('Hiển thị lời giải khi sai')).toBeLessThan(html.indexOf('Nội dung học'));
    expect(html).toMatch(/<div role="radiogroup" aria-labelledby="settings-incorrect-feedback"/);
    expect(html).toContain('id="settings-incorrect-feedback"');
  });

  it('Popup preview: dimmed answers behind a separate floating explanation panel', () => {
    const mini = miniature(renderSettings(), 'popup');
    expect(mini.match(/bg-answer-\d-bg[^"]*opacity-50/g)).toHaveLength(4);
    expect(mini).toMatch(/data-mini-part="popup-panel" class="absolute [^"]*bg-surface[^"]*shadow-clay-card/);
    expect(mini).not.toContain('border-dashed');
  });

  it('Inline preview: answers stay visible with a dashed explanation box below them', () => {
    const mini = miniature(renderSettings(), 'inline');
    expect(mini.match(/bg-answer-\d-bg/g)).toHaveLength(2);
    expect(mini).not.toContain('opacity-50');
    // The dashed box comes after the answers and is not another answer button
    expect(mini.indexOf('data-mini-part="inline-box"')).toBeGreaterThan(mini.lastIndexOf('bg-answer-'));
    expect(mini).toMatch(/data-mini-part="inline-box" class="[^"]*border-dashed/);
    expect(mini).not.toContain('absolute');
  });

  it('defaults to Popup, with Vietnamese labels', () => {
    const html = renderSettings('vi');
    expect(optionTag(html, 'popup')).toContain('aria-checked="true"');
    expect(optionTag(html, 'popup')).toContain('aria-label="Cửa sổ"');
    expect(optionTag(html, 'inline')).toContain('aria-checked="false"');
    expect(optionTag(html, 'inline')).toContain('aria-label="Dưới đáp án"');
  });

  it('localizes the section in English', () => {
    const html = renderSettings('en', 'inline');
    expect(html).toContain('Incorrect answer feedback');
    expect(optionTag(html, 'popup')).toContain('aria-label="Popup"');
    expect(optionTag(html, 'inline')).toContain('aria-label="Inline"');
    expect(optionTag(html, 'inline')).toContain('aria-checked="true"');
  });

  it('selection is a shape cue (border + ring), one tab stop, focus ring, and a 48px+ target', () => {
    const html = renderSettings('vi', 'inline');
    const selected = optionTag(html, 'inline');
    const other = optionTag(html, 'popup');
    expect(selected).toContain('border-primary ring-2 ring-primary');
    expect(other).not.toContain('ring-2 ring-primary');
    expect(selected).toContain('tabindex="0"');
    expect(other).toContain('tabindex="-1"');
    expect(selected).toContain('min-h-[64px]');
    expect(selected).toContain('focus-visible:');
  });

  it('renders with semantic theme tokens in every theme (no hard-coded colors)', () => {
    for (const theme of ['light', 'dark', 'sakura', 'meo'] as const) {
      const html = renderSettings('vi', 'popup', theme);
      for (const style of ['popup', 'inline'] as const) {
        const mini = miniature(html, style);
        expect(mini, `${theme}/${style}`).toContain('bg-page');
        expect(mini, `${theme}/${style}`).toContain('bg-error');
        expect(mini, `${theme}/${style}`).not.toMatch(/#[0-9a-f]{3,6}|rgb\(/i);
      }
    }
  });

  it('selecting a card or using the arrow keys changes the style', () => {
    const onChange = vi.fn();
    const cards = previewPickerCards(makeState(), () => IncorrectFeedbackPicker({ value: 'popup', onChange }));
    expect(cards.map((card) => card.value)).toEqual(['popup', 'inline']);
    cards[1].onSelect();
    expect(onChange).toHaveBeenLastCalledWith('inline');
    cards[0].onSelect();
    expect(onChange).toHaveBeenLastCalledWith('popup');
    const preventDefault = vi.fn();
    cards[0].onKeyDown({ key: 'ArrowDown', preventDefault });
    expect(onChange).toHaveBeenLastCalledWith('inline');
    cards[1].onKeyDown({ key: 'ArrowUp', preventDefault });
    expect(onChange).toHaveBeenLastCalledWith('popup');
    expect(preventDefault).toHaveBeenCalledTimes(2);
  });

  it('saves through the existing preference flow, and a failed save changes nothing', () => {
    const saved: string[] = [];
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: (_key: string, value: string) => saved.push(value),
      removeItem: () => undefined,
    });
    let ctx: AppStateContextValue | null = null;
    const Consumer = () => {
      ctx = useAppState();
      return null;
    };
    renderToString(
      <AppStateProvider initialState={makeState()}>
        <Consumer />
      </AppStateProvider>
    );
    expect(applyPreferenceChange(ctx!.updatePreferences, { incorrectFeedback: 'inline' })).toBe(true);
    expect(JSON.parse(saved[0]).incorrectFeedback).toBe('inline');

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => undefined,
    });
    expect(applyPreferenceChange(ctx!.updatePreferences, { incorrectFeedback: 'popup' })).toBe(false);
  });
});
