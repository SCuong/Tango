import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppStateProvider, useAppState, AppStateContextValue } from '../useAppState';
import { UserStudyState } from '../../types';

describe('src/hooks/useAppState.tsx', () => {
  const mockInitialState: UserStudyState = {
    version: 1,
    preferences: {
      theme: 'light',
      language: 'vi',
      soundEnabled: false,
      answerLayout: 'grid',
    },
    books: {},
    lessons: {},
    progressByItem: {},
    recentResults: [],
  };

  it('throws an error if useAppState is called outside of AppStateProvider', () => {
    const ComponentWithoutProvider = () => {
      useAppState();
      return <div>Test</div>;
    };

    expect(() => renderToString(<ComponentWithoutProvider />)).toThrow(
      'useAppState must be used within an AppStateProvider'
    );
  });

  it('provides the bootstrapped initial state to descendant components', () => {
    let capturedContext: AppStateContextValue | null = null;

    const Consumer = () => {
      capturedContext = useAppState();
      return <div>Rendered</div>;
    };

    renderToString(
      <AppStateProvider initialState={mockInitialState}>
        <Consumer />
      </AppStateProvider>
    );

    expect(capturedContext).not.toBeNull();
    expect(capturedContext!.state).toEqual(mockInitialState);
    expect(typeof capturedContext!.reloadState).toBe('function');
    expect(typeof capturedContext!.updatePreferences).toBe('function');
  });

  describe('updatePreferences operation', () => {
    class LocalStorageMock {
      private store = new Map<string, string>();
      getItem(key: string): string | null {
        return this.store.get(key) ?? null;
      }
      setItem(key: string, value: string): void {
        this.store.set(key, String(value));
      }
      removeItem(key: string): void {
        this.store.delete(key);
      }
      clear(): void {
        this.store.clear();
      }
      get length(): number {
        return this.store.size;
      }
      key(index: number): string | null {
        return Array.from(this.store.keys())[index] ?? null;
      }
    }

    beforeEach(() => {
      const mockStorage = new LocalStorageMock();
      vi.stubGlobal('localStorage', mockStorage);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('persists merged preferences and updates document root on updatePreferences call', () => {
      const mockDocumentElement = {
        dataset: {} as Record<string, string>,
        lang: '',
        setAttribute(name: string, value: string) {
          if (name === 'data-theme') {
            this.dataset.theme = value;
          }
        },
      };

      vi.stubGlobal('document', {
        documentElement: mockDocumentElement,
      });

      let capturedContext: AppStateContextValue | null = null;
      const Consumer = () => {
        capturedContext = useAppState();
        return <div>Rendered</div>;
      };

      renderToString(
        <AppStateProvider initialState={mockInitialState}>
          <Consumer />
        </AppStateProvider>
      );

      capturedContext!.updatePreferences({ theme: 'sakura', language: 'en' });

      // Verifies persistence write succeeded
      const stored = JSON.parse(
        localStorage.getItem('tango_v1_preferences') || '{}'
      );
      expect(stored).toEqual({
        theme: 'sakura',
        language: 'en',
        soundEnabled: false,
        answerLayout: 'grid',
      });

      // Verifies document synchronization succeeded
      expect(mockDocumentElement.dataset.theme).toBe('sakura');
      expect(mockDocumentElement.lang).toBe('en');
    });

    it('aborts update and does not touch document if persistence write fails', () => {
      const mockDocumentElement = {
        dataset: { theme: 'light' } as Record<string, string>,
        lang: 'vi',
        setAttribute(name: string, value: string) {
          if (name === 'data-theme') {
            this.dataset.theme = value;
          }
        },
      };

      vi.stubGlobal('document', {
        documentElement: mockDocumentElement,
      });

      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      let capturedContext: AppStateContextValue | null = null;
      const Consumer = () => {
        capturedContext = useAppState();
        return <div>Rendered</div>;
      };

      renderToString(
        <AppStateProvider initialState={mockInitialState}>
          <Consumer />
        </AppStateProvider>
      );

      expect(() => {
        capturedContext!.updatePreferences({ theme: 'dark' });
      }).toThrow('QuotaExceededError');

      // Document root must remain unchanged because write failed
      expect(mockDocumentElement.dataset.theme).toBe('light');
      expect(mockDocumentElement.lang).toBe('vi');
    });

    it('preserves both updates when two synchronous updatePreferences calls occur before rerender', () => {
      const mockDocumentElement = {
        dataset: {} as Record<string, string>,
        lang: '',
        setAttribute(name: string, value: string) {
          if (name === 'data-theme') {
            this.dataset.theme = value;
          }
        },
      };

      vi.stubGlobal('document', {
        documentElement: mockDocumentElement,
      });

      let capturedContext: AppStateContextValue | null = null;
      const Consumer = () => {
        capturedContext = useAppState();
        return <div>Rendered</div>;
      };

      renderToString(
        <AppStateProvider initialState={mockInitialState}>
          <Consumer />
        </AppStateProvider>
      );

      // Two synchronous partial updates before any React rerender occurs
      capturedContext!.updatePreferences({ theme: 'dark' });
      capturedContext!.updatePreferences({ language: 'en' });

      // Verifies both updates were sequentially merged and persisted
      const stored = JSON.parse(
        localStorage.getItem('tango_v1_preferences') || '{}'
      );
      expect(stored).toEqual({
        theme: 'dark',
        language: 'en',
        soundEnabled: false,
        answerLayout: 'grid',
      });

      // Verifies document root was sequentially updated
      expect(mockDocumentElement.dataset.theme).toBe('dark');
      expect(mockDocumentElement.lang).toBe('en');
    });

    it('merges against freshly reloaded preferences when reloadState is immediately followed by updatePreferences', () => {
      const mockDocumentElement = {
        dataset: {} as Record<string, string>,
        lang: '',
        setAttribute(name: string, value: string) {
          if (name === 'data-theme') {
            this.dataset.theme = value;
          }
        },
      };

      vi.stubGlobal('document', {
        documentElement: mockDocumentElement,
      });

      let capturedContext: AppStateContextValue | null = null;
      const Consumer = () => {
        capturedContext = useAppState();
        return <div>Rendered</div>;
      };

      renderToString(
        <AppStateProvider initialState={mockInitialState}>
          <Consumer />
        </AppStateProvider>
      );

      // Simulate external storage update (e.g. from background or another component)
      localStorage.setItem(
        'tango_v1_preferences',
        JSON.stringify({
          theme: 'sakura',
          language: 'vi',
          soundEnabled: true,
          answerLayout: 'grid',
        })
      );

      // reloadState followed immediately by updatePreferences without React rerender
      capturedContext!.reloadState();
      capturedContext!.updatePreferences({ language: 'en' });

      const stored = JSON.parse(
        localStorage.getItem('tango_v1_preferences') || '{}'
      );
      expect(stored).toEqual({
        theme: 'sakura',
        language: 'en',
        soundEnabled: true,
        answerLayout: 'grid',
      });

      expect(mockDocumentElement.dataset.theme).toBe('sakura');
      expect(mockDocumentElement.lang).toBe('en');
    });
  });
});
