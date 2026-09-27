import { renderToString } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { AppStateProvider } from '../useAppState';
import { useI18n, UseI18nResult } from '../useI18n';
import { UserStudyState } from '../../types';

describe('src/hooks/useI18n.ts', () => {
  const baseState: UserStudyState = {
    version: 1,
    preferences: {
      theme: 'light',
      language: 'vi',
      soundEnabled: false,
    },
    books: {},
    lessons: {},
    progressByItem: {},
    recentResults: [],
  };

  it('derives active language from AppStateProvider preferences (vi)', () => {
    let capturedI18n: UseI18nResult | null = null;

    const Consumer = () => {
      capturedI18n = useI18n();
      return <div>{capturedI18n.t('nav.home')}</div>;
    };

    renderToString(
      <AppStateProvider initialState={baseState}>
        <Consumer />
      </AppStateProvider>
    );

    expect(capturedI18n).not.toBeNull();
    expect(capturedI18n!.language).toBe('vi');
    expect(capturedI18n!.t('nav.home')).toBe('Trang chủ');
    expect(capturedI18n!.t('action.save')).toBe('Lưu');
  });

  it('derives active language from AppStateProvider preferences (en)', () => {
    let capturedI18n: UseI18nResult | null = null;

    const enState: UserStudyState = {
      ...baseState,
      preferences: {
        ...baseState.preferences,
        language: 'en',
      },
    };

    const Consumer = () => {
      capturedI18n = useI18n();
      return <div>{capturedI18n.t('nav.home')}</div>;
    };

    renderToString(
      <AppStateProvider initialState={enState}>
        <Consumer />
      </AppStateProvider>
    );

    expect(capturedI18n).not.toBeNull();
    expect(capturedI18n!.language).toBe('en');
    expect(capturedI18n!.t('nav.home')).toBe('Home');
    expect(capturedI18n!.t('action.save')).toBe('Save');
  });
});
