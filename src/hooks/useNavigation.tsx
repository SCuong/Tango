/**
 * Tango — Browser Navigation Context & Hook
 *
 * Governed by:
 * - docs/ARCHITECTURE.md (§§2, 7)
 * - docs/SCREEN_SPEC.md (§§1, 2, 4)
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type FC,
  type ReactNode,
} from 'react';
import { AppRoute, parseRoute, buildPath } from '../lib/routes';

export interface NavigationContextValue {
  route: AppRoute;
  navigate: (target: string | AppRoute) => void;
  replace: (target: string | AppRoute) => void;
  back: () => void;
  /**
   * Returns to a screen's parent. When the previous in-app history entry is exactly that
   * parent, the browser history steps back (so Back/forward stay natural); otherwise the
   * current entry is replaced by the parent, which keeps deep links predictable.
   */
  goUp: (parent: AppRoute) => void;
  /**
   * Returns to the previous in-app screen when one exists, otherwise replaces the current
   * entry with `fallback` (e.g. a deep-linked Settings screen closes to Home).
   */
  goBack: (fallback: AppRoute) => void;
  /**
   * Registers a guard for browser Back/Forward (e.g. an active quiz). When the guard returns
   * true for the destination pathname, the navigation is undone (the current URL is restored)
   * and the screen stays mounted so it can ask for confirmation. Pass null to remove it.
   */
  setNavigationBlocker: (blocker: ((destinationPath: string) => boolean) | null) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export interface NavigationProviderProps {
  initialPath?: string;
  children: ReactNode;
}

/** Pathname without query or hash, used to compare in-app history entries. */
function toPathname(target: string): string {
  return target.split('?')[0].split('#')[0];
}

/**
 * Mirrors a browser Back/Forward step on the in-app pathname stack: same-URL pops (dialog or
 * guard markers) keep the position; a neighbor match moves one step; anything else restarts the
 * stack at the destination.
 */
export function reconcileHistoryStack(
  stack: string[],
  index: number,
  path: string
): { stack: string[]; index: number } {
  if (stack[index] === path) return { stack, index };
  if (index > 0 && stack[index - 1] === path) return { stack, index: index - 1 };
  if (stack[index + 1] === path) return { stack, index: index + 1 };
  const found = stack.lastIndexOf(path, index);
  if (found >= 0) return { stack, index: found };
  return { stack: [path], index: 0 };
}

function currentWindowPath(): string | null {
  if (typeof window === 'undefined' || !window.location) return null;
  return window.location.pathname;
}

export const NavigationProvider: FC<NavigationProviderProps> = ({
  initialPath,
  children,
}) => {
  const [route, setRoute] = useState<AppRoute>(() => {
    if (initialPath) {
      return parseRoute(initialPath);
    }
    const windowPath = currentWindowPath();
    if (windowPath !== null) {
      return parseRoute(windowPath);
    }
    return { type: 'home' };
  });

  // In-memory mirror of the in-app history stack (pathnames only). It lets goUp/goBack
  // decide between a real history step and a replace without storing data in history.state.
  const stackRef = useRef<string[]>([
    toPathname(initialPath ?? currentWindowPath() ?? '/'),
  ]);
  const indexRef = useRef(0);
  const blockerRef = useRef<((destinationPath: string) => boolean) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const path = window.location.pathname;
      const stack = stackRef.current;
      const index = indexRef.current;

      // A registered guard keeps the current screen: restore its URL and let it confirm
      if (stack[index] !== path && blockerRef.current?.(path)) {
        window.history.pushState(null, '', stack[index]);
        return;
      }

      const next = reconcileHistoryStack(stack, index, path);
      stackRef.current = next.stack;
      indexRef.current = next.index;

      setRoute(parseRoute(path));
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = useCallback((target: string | AppRoute) => {
    const path = typeof target === 'string' ? target : buildPath(target);
    const nextRoute = typeof target === 'string' ? parseRoute(target) : target;

    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState(null, '', path);
    }
    stackRef.current = [
      ...stackRef.current.slice(0, indexRef.current + 1),
      toPathname(path),
    ];
    indexRef.current = stackRef.current.length - 1;
    setRoute(nextRoute);
  }, []);

  const replace = useCallback((target: string | AppRoute) => {
    const path = typeof target === 'string' ? target : buildPath(target);
    const nextRoute = typeof target === 'string' ? parseRoute(target) : target;

    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', path);
    }
    stackRef.current[indexRef.current] = toPathname(path);
    setRoute(nextRoute);
  }, []);

  const back = useCallback(() => {
    if (typeof window !== 'undefined' && window.history) {
      window.history.back();
    }
  }, []);

  const goUp = useCallback(
    (parent: AppRoute) => {
      const parentPath = buildPath(parent);
      const index = indexRef.current;
      if (index > 0 && stackRef.current[index - 1] === parentPath) {
        back();
      } else {
        replace(parent);
      }
    },
    [back, replace]
  );

  const goBack = useCallback(
    (fallback: AppRoute) => {
      if (indexRef.current > 0) {
        back();
      } else {
        replace(fallback);
      }
    },
    [back, replace]
  );

  const setNavigationBlocker = useCallback(
    (blocker: ((destinationPath: string) => boolean) | null) => {
      blockerRef.current = blocker;
    },
    []
  );

  const contextValue = useMemo<NavigationContextValue>(
    () => ({
      route,
      navigate,
      replace,
      back,
      goUp,
      goBack,
      setNavigationBlocker,
    }),
    [route, navigate, replace, back, goUp, goBack, setNavigationBlocker]
  );

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
