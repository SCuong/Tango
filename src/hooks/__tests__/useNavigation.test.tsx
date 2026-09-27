import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NavigationProvider,
  useNavigation,
  NavigationContextValue,
} from '../useNavigation';

describe('src/hooks/useNavigation.tsx', () => {
  it('throws an error if useNavigation is called outside of NavigationProvider', () => {
    const ComponentWithoutProvider = () => {
      useNavigation();
      return <div>Test</div>;
    };

    expect(() => renderToString(<ComponentWithoutProvider />)).toThrow(
      'useNavigation must be used within a NavigationProvider'
    );
  });

  it('provides the initial route from initialPath prop', () => {
    let capturedContext: NavigationContextValue | null = null;

    const Consumer = () => {
      capturedContext = useNavigation();
      return <div>Rendered</div>;
    };

    renderToString(
      <NavigationProvider initialPath="/book/book-01">
        <Consumer />
      </NavigationProvider>
    );

    expect(capturedContext).not.toBeNull();
    expect(capturedContext!.route).toEqual({
      type: 'book_study',
      bookId: 'book-01',
    });
    expect(typeof capturedContext!.navigate).toBe('function');
    expect(typeof capturedContext!.replace).toBe('function');
    expect(typeof capturedContext!.back).toBe('function');
  });

  it('defaults to home route when initialPath is "/" or omitted in non-browser environment', () => {
    let capturedContext: NavigationContextValue | null = null;

    const Consumer = () => {
      capturedContext = useNavigation();
      return <div>Rendered</div>;
    };

    renderToString(
      <NavigationProvider>
        <Consumer />
      </NavigationProvider>
    );

    expect(capturedContext).not.toBeNull();
    expect(capturedContext!.route).toEqual({ type: 'home' });
  });

  describe('browser navigation interactions', () => {
    let pushStateSpy: ReturnType<typeof vi.fn>;
    let replaceStateSpy: ReturnType<typeof vi.fn>;
    let backSpy: ReturnType<typeof vi.fn>;
    let eventListeners: Record<string, ((e: Event) => void)[]> = {};

    beforeEach(() => {
      pushStateSpy = vi.fn();
      replaceStateSpy = vi.fn();
      backSpy = vi.fn();
      eventListeners = {};

      vi.stubGlobal('window', {
        location: {
          pathname: '/settings',
        },
        history: {
          pushState: pushStateSpy,
          replaceState: replaceStateSpy,
          back: backSpy,
        },
        addEventListener: (event: string, listener: (e: Event) => void) => {
          if (!eventListeners[event]) eventListeners[event] = [];
          eventListeners[event].push(listener);
        },
        removeEventListener: (event: string, listener: (e: Event) => void) => {
          if (!eventListeners[event]) return;
          eventListeners[event] = eventListeners[event].filter((l) => l !== listener);
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('reads initial route from window.location.pathname when initialPath is not provided', () => {
      let capturedContext: NavigationContextValue | null = null;

      const Consumer = () => {
        capturedContext = useNavigation();
        return <div>Rendered</div>;
      };

      renderToString(
        <NavigationProvider>
          <Consumer />
        </NavigationProvider>
      );

      expect(capturedContext!.route).toEqual({ type: 'settings' });
    });

    it('navigates with string path and updates browser history', () => {
      let capturedContext: NavigationContextValue | null = null;

      const Consumer = () => {
        capturedContext = useNavigation();
        return <div>Rendered</div>;
      };

      renderToString(
        <NavigationProvider initialPath="/">
          <Consumer />
        </NavigationProvider>
      );

      capturedContext!.navigate('/learn/vocabulary');

      expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/learn/vocabulary');
    });

    it('navigates with typed AppRoute object and updates browser history', () => {
      let capturedContext: NavigationContextValue | null = null;

      const Consumer = () => {
        capturedContext = useNavigation();
        return <div>Rendered</div>;
      };

      renderToString(
        <NavigationProvider initialPath="/">
          <Consumer />
        </NavigationProvider>
      );

      capturedContext!.navigate({
        type: 'manage_book',
        bookId: 'my book',
      });

      expect(pushStateSpy).toHaveBeenCalledWith(
        null,
        '',
        '/settings/content-management/book/my%20book'
      );
    });

    it('replaces current history entry on replace() call', () => {
      let capturedContext: NavigationContextValue | null = null;

      const Consumer = () => {
        capturedContext = useNavigation();
        return <div>Rendered</div>;
      };

      renderToString(
        <NavigationProvider initialPath="/">
          <Consumer />
        </NavigationProvider>
      );

      capturedContext!.replace('/quiz/results');

      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/quiz/results');
    });

    it('delegates back() to window.history.back()', () => {
      let capturedContext: NavigationContextValue | null = null;

      const Consumer = () => {
        capturedContext = useNavigation();
        return <div>Rendered</div>;
      };

      renderToString(
        <NavigationProvider initialPath="/">
          <Consumer />
        </NavigationProvider>
      );

      capturedContext!.back();
      expect(backSpy).toHaveBeenCalledTimes(1);
    });
  });
});
