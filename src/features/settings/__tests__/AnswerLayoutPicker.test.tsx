import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AppStateProvider, AppStateContextValue, useAppState } from '../../../hooks/useAppState';
import { NavigationProvider } from '../../../hooks/useNavigation';
import { AnswerLayout, AppLanguage, UserStudyState } from '../../../types';
import { AnswerLayoutPicker, SettingsScreen, applyPreferenceChange } from '../SettingsScreen';
import { previewPickerCards } from './previewPickerHarness';

function makeState(language: AppLanguage = 'vi', answerLayout: AnswerLayout = 'grid'): UserStudyState {
  return {
    version: 1,
    preferences: { theme: 'light', language, soundEnabled: false, answerLayout, incorrectFeedback: 'popup' },
    books: {},
    lessons: {},
    progressByItem: {},
    recentResults: [],
  };
}

function renderSettings(language: AppLanguage = 'vi', answerLayout: AnswerLayout = 'grid'): string {
  return renderToString(
    <AppStateProvider initialState={makeState(language, answerLayout)}>
      <NavigationProvider initialPath="/settings">
        <SettingsScreen />
      </NavigationProvider>
    </AppStateProvider>
  );
}

function optionTag(html: string, layout: AnswerLayout): string {
  return html.match(new RegExp(`<button[^>]*data-answer-layout-option="${layout}"[^>]*>`))![0];
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Settings answer layout preference', () => {
  it('shows two preview cards in a radio group after Sound Effects', () => {
    const html = renderSettings();
    expect(html.indexOf('Âm thanh hiệu ứng')).toBeLessThan(html.indexOf('Bố cục đáp án'));
    expect(html.indexOf('Bố cục đáp án')).toBeLessThan(html.indexOf('Nội dung học'));
    expect(html).toMatch(/<div role="radiogroup" aria-labelledby="settings-answer-layout"/);
    // Grid preview: 2×2 tiles; stacked preview: four rows; both in the quiz answer colors
    expect(html).toMatch(/data-mini-layout="grid"[^>]*class="[^"]*grid-cols-2 grid-rows-2/);
    expect(html).toMatch(/data-mini-layout="stacked"[^>]*class="[^"]*grid-rows-4/);
    for (const layout of ['grid', 'stacked']) {
      const mini = html.match(new RegExp(`data-mini-layout="${layout}"[\\s\\S]*?</span></span>`))![0];
      expect(mini.match(/bg-answer-\d-bg/g), layout).toHaveLength(4);
    }
  });

  it('defaults to Grid, with Vietnamese labels and the fallback helper text', () => {
    const html = renderSettings('vi');
    expect(optionTag(html, 'grid')).toContain('aria-checked="true"');
    expect(optionTag(html, 'grid')).toContain('aria-label="Lưới 2×2"');
    expect(optionTag(html, 'grid')).toContain('aria-describedby="settings-answer-layout-desc"');
    expect(optionTag(html, 'stacked')).toContain('aria-checked="false"');
    expect(optionTag(html, 'stacked')).toContain('aria-label="Danh sách"');
    expect(html).toContain('Tự chuyển sang danh sách khi đáp án quá dài.');
  });

  it('localizes the section in English', () => {
    const html = renderSettings('en', 'stacked');
    expect(html).toContain('Answer layout');
    expect(optionTag(html, 'grid')).toContain('aria-label="2×2 Grid"');
    expect(optionTag(html, 'stacked')).toContain('aria-label="Stacked"');
    expect(optionTag(html, 'stacked')).toContain('aria-checked="true"');
    expect(html).toContain('Long answers automatically switch to the stacked layout.');
  });

  it('is keyboard operable with one tab stop, and touch targets of at least 48px', () => {
    const html = renderSettings();
    expect(optionTag(html, 'grid')).toContain('tabindex="0"');
    expect(optionTag(html, 'stacked')).toContain('tabindex="-1"');
    expect(optionTag(html, 'grid')).toContain('min-h-[64px]');
    expect(optionTag(html, 'grid')).toContain('focus-visible:');
  });

  it('selecting a card or using the arrow keys changes the layout', () => {
    const onChange = vi.fn();
    const cards = previewPickerCards(makeState(), () => AnswerLayoutPicker({ value: 'grid', onChange }));
    expect(cards.map((card) => card.value)).toEqual(['grid', 'stacked']);
    cards[1].onSelect();
    expect(onChange).toHaveBeenLastCalledWith('stacked');
    cards[0].onSelect();
    expect(onChange).toHaveBeenLastCalledWith('grid');
    const preventDefault = vi.fn();
    cards[0].onKeyDown({ key: 'ArrowRight', preventDefault });
    expect(onChange).toHaveBeenLastCalledWith('stacked');
    cards[1].onKeyDown({ key: 'ArrowLeft', preventDefault });
    expect(onChange).toHaveBeenLastCalledWith('grid');
    expect(preventDefault).toHaveBeenCalledTimes(2);
  });

  it('saves Grid and Stacked through the existing preference flow', () => {
    const saved: string[] = [];
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: (key: string, value: string) => saved.push(`${key}=${value}`),
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
    expect(applyPreferenceChange(ctx!.updatePreferences, { answerLayout: 'stacked' })).toBe(true);
    expect(saved[0]).toBe('tango_v1_preferences={"theme":"light","language":"vi","soundEnabled":false,"answerLayout":"stacked","incorrectFeedback":"popup"}');
    expect(applyPreferenceChange(ctx!.updatePreferences, { answerLayout: 'grid' })).toBe(true);
    expect(JSON.parse(saved[1].split('=')[1]).answerLayout).toBe('grid');
  });

  it('keeps the saved and in-memory layout unchanged when saving fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const stored = new Map([['tango_v1_preferences', JSON.stringify(makeState().preferences)]]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
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
    expect(applyPreferenceChange(ctx!.updatePreferences, { answerLayout: 'stacked' })).toBe(false);
    expect(JSON.parse(stored.get('tango_v1_preferences')!).answerLayout).toBe('grid');

    // The next successful change starts from the unchanged in-memory Grid preference
    const saved: string[] = [];
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: (_key: string, value: string) => saved.push(value),
      removeItem: () => undefined,
    });
    expect(applyPreferenceChange(ctx!.updatePreferences, { soundEnabled: true })).toBe(true);
    expect(JSON.parse(saved[0]).answerLayout).toBe('grid');
  });
});
