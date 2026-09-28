import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NavigationProvider,
  useNavigation,
  NavigationContextValue,
  reconcileHistoryStack,
  historyStepsBackTo,
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
    let goSpy: ReturnType<typeof vi.fn>;
    let location: { pathname: string };
    let eventListeners: Record<string, ((e: Event) => void)[]> = {};

    beforeEach(() => {
      pushStateSpy = vi.fn();
      replaceStateSpy = vi.fn();
      backSpy = vi.fn();
      goSpy = vi.fn();
      eventListeners = {};
      location = { pathname: '/settings' };

      vi.stubGlobal('window', {
        location,
        history: {
          pushState: pushStateSpy,
          replaceState: replaceStateSpy,
          back: backSpy,
          go: goSpy,
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
    it('goUp steps back in history when the previous in-app entry is the parent', () => {
      let ctx: NavigationContextValue | null = null;
      const Consumer = () => {
        ctx = useNavigation();
        return null;
      };
      renderToString(
        <NavigationProvider initialPath="/">
          <Consumer />
        </NavigationProvider>
      );
      ctx!.navigate({ type: 'book_study', bookId: 'b1' });
      ctx!.goUp({ type: 'home' });
      expect(backSpy).toHaveBeenCalledTimes(1);
      expect(replaceStateSpy).not.toHaveBeenCalled();
    });

    it('goUp replaces the entry when the parent is not the previous screen (deep link)', () => {
      let ctx: NavigationContextValue | null = null;
      const Consumer = () => {
        ctx = useNavigation();
        return null;
      };
      renderToString(
        <NavigationProvider initialPath="/book/b1/category/kanji">
          <Consumer />
        </NavigationProvider>
      );
      ctx!.goUp({ type: 'book_study', bookId: 'b1' });
      expect(backSpy).not.toHaveBeenCalled();
      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/book/b1');
    });

    it('goBack uses history only when an in-app previous screen exists', () => {
      let ctx: NavigationContextValue | null = null;
      const Consumer = () => {
        ctx = useNavigation();
        return null;
      };
      renderToString(
        <NavigationProvider initialPath="/settings">
          <Consumer />
        </NavigationProvider>
      );
      ctx!.goBack({ type: 'home' });
      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/');
      ctx!.navigate('/settings/content-management');
      ctx!.goBack({ type: 'home' });
      expect(backSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('returnTo (Quiz Results back to the quiz origin)', () => {
    let pushStateSpy: ReturnType<typeof vi.fn>;
    let replaceStateSpy: ReturnType<typeof vi.fn>;
    let backSpy: ReturnType<typeof vi.fn>;
    let goSpy: ReturnType<typeof vi.fn>;
    let location: { pathname: string };

    beforeEach(() => {
      pushStateSpy = vi.fn((_state: unknown, _title: string, path: string) => {
        location.pathname = path;
      });
      replaceStateSpy = vi.fn((_state: unknown, _title: string, path: string) => {
        location.pathname = path;
      });
      backSpy = vi.fn();
      goSpy = vi.fn();
      location = { pathname: '/' };
      vi.stubGlobal('window', {
        location,
        history: { pushState: pushStateSpy, replaceState: replaceStateSpy, back: backSpy, go: goSpy },
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function mount(initialPath: string) {
      let ctx: NavigationContextValue | null = null;
      const Consumer = () => {
        ctx = useNavigation();
        return null;
      };
      renderToString(
        <NavigationProvider initialPath={initialPath}>
          <Consumer />
        </NavigationProvider>
      );
      return () => ctx!;
    }

    it('goes back through history to the origin entry, so Back never bounces into Results', () => {
      const nav = mount('/');
      const kanji = { type: 'category_inside_book', bookId: 'b1', category: 'kanji' } as const;
      nav().navigate({ type: 'book_study', bookId: 'b1' });
      nav().navigate(kanji);
      nav().navigate({ type: 'category_quiz_config', bookId: 'b1', category: 'kanji' });
      nav().navigate({ type: 'quiz_session' });
      nav().goUp({ type: 'quiz_results' }); // the runner replaces the session with Results
      pushStateSpy.mockClear();
      replaceStateSpy.mockClear();

      nav().returnTo(kanji);
      // Kanji is 2 entries back (config and Results are left behind as forward entries)
      expect(goSpy).toHaveBeenCalledWith(-2);
      expect(pushStateSpy).not.toHaveBeenCalled();
      expect(replaceStateSpy).not.toHaveBeenCalled();
    });

    it('replaces Results with the origin when it is not in the in-app history (deep link / reload)', () => {
      const nav = mount('/quiz/results');
      nav().returnTo({ type: 'category_inside_book', bookId: 'b1', category: 'kanji' });
      expect(goSpy).not.toHaveBeenCalled();
      expect(pushStateSpy).not.toHaveBeenCalled();
      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/book/b1/category/kanji');
    });

    it('lands on the origin entry after the history jump, so Back continues from there', () => {
      const stack = ['/', '/book/b1', '/book/b1/category/kanji', '/book/b1/category/kanji/quiz-config', '/quiz/results'];
      const steps = historyStepsBackTo(stack, 4, '/book/b1/category/kanji');
      expect(steps).toBe(-2);
      // The popstate for that jump reconciles the in-app stack onto the origin entry
      const next = reconcileHistoryStack(stack, 4, '/book/b1/category/kanji');
      expect(next).toEqual({ stack, index: 2 });
      // Back from the category is the book, not the Results or the quiz session
      expect(next.stack[next.index - 1]).toBe('/book/b1');
    });
  });

  describe('historyStepsBackTo', () => {
    it('finds the nearest earlier entry', () => {
      expect(historyStepsBackTo(['/', '/a', '/b', '/results'], 3, '/a')).toBe(-2);
      expect(historyStepsBackTo(['/', '/a', '/x', '/a', '/results'], 4, '/a')).toBe(-1);
    });
    it('ignores the current and later entries', () => {
      expect(historyStepsBackTo(['/', '/results', '/a'], 1, '/a')).toBeNull();
      expect(historyStepsBackTo(['/a'], 0, '/a')).toBeNull();
      expect(historyStepsBackTo(['/', '/results'], 1, '/missing')).toBeNull();
    });
  });

  describe('reconcileHistoryStack', () => {
    it('keeps the position for same-URL marker pops', () => {
      expect(reconcileHistoryStack(['/', '/quiz/session'], 1, '/quiz/session')).toEqual({ stack: ['/', '/quiz/session'], index: 1 });
    });
    it('moves back and forward between neighbors', () => {
      expect(reconcileHistoryStack(['/', '/a', '/b'], 2, '/a').index).toBe(1);
      expect(reconcileHistoryStack(['/', '/a', '/b'], 1, '/b').index).toBe(2);
    });
    it('restarts the stack for unknown destinations', () => {
      expect(reconcileHistoryStack(['/a'], 0, '/x')).toEqual({ stack: ['/x'], index: 0 });
    });
  });
});
