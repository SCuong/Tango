import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AppStateProvider, AppStateContextValue, useAppState } from '../../../hooks/useAppState';
import { UserStudyState } from '../../../types';
import { applyPreferenceChange } from '../SettingsScreen';

const initialState: UserStudyState = {
  version: 1,
  preferences: { theme: 'light', language: 'vi', soundEnabled: false },
  books: {},
  lessons: {},
  progressByItem: {},
  recentResults: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Settings preference persistence failures', () => {
  it('reports success when the preference is saved', () => {
    const update = vi.fn();
    expect(applyPreferenceChange(update, { theme: 'dark' })).toBe(true);
    expect(update).toHaveBeenCalledWith({ theme: 'dark' });
  });

  it('reports failure instead of throwing when saving fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const update = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });
    expect(applyPreferenceChange(update, { language: 'en' })).toBe(false);
  });

  it('keeps stored preferences, document theme, and in-memory state unchanged on failure', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const root = {
      dataset: { theme: 'light' } as Record<string, string>,
      lang: 'vi',
      setAttribute(name: string, value: string) {
        if (name === 'data-theme') this.dataset.theme = value;
      },
    };
    vi.stubGlobal('document', { documentElement: root });
    const stored = new Map<string, string>([['tango_v1_preferences', JSON.stringify(initialState.preferences)]]);
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
      <AppStateProvider initialState={initialState}>
        <Consumer />
      </AppStateProvider>
    );

    expect(applyPreferenceChange(ctx!.updatePreferences, { theme: 'sakura', language: 'en' })).toBe(false);
    expect(root.dataset.theme).toBe('light');
    expect(root.lang).toBe('vi');
    expect(JSON.parse(stored.get('tango_v1_preferences')!)).toEqual(initialState.preferences);

    // A later successful change starts from the unchanged in-memory preferences
    const saved: string[] = [];
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: (_key: string, value: string) => saved.push(value),
      removeItem: () => undefined,
    });
    expect(applyPreferenceChange(ctx!.updatePreferences, { soundEnabled: true })).toBe(true);
    expect(JSON.parse(saved[0])).toEqual({ theme: 'light', language: 'vi', soundEnabled: true });
  });
});
