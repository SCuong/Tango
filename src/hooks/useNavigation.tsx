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
  type FC,
  type ReactNode,
} from 'react';
import { AppRoute, parseRoute, buildPath } from '../lib/routes';

export interface NavigationContextValue {
  route: AppRoute;
  navigate: (target: string | AppRoute) => void;
  replace: (target: string | AppRoute) => void;
  back: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export interface NavigationProviderProps {
  initialPath?: string;
  children: ReactNode;
}

export const NavigationProvider: FC<NavigationProviderProps> = ({
  initialPath,
  children,
}) => {
  const [route, setRoute] = useState<AppRoute>(() => {
    if (initialPath) {
      return parseRoute(initialPath);
    }
    if (typeof window !== 'undefined' && window.location) {
      return parseRoute(window.location.pathname);
    }
    return { type: 'home' };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      setRoute(parseRoute(window.location.pathname));
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
    setRoute(nextRoute);
  }, []);

  const replace = useCallback((target: string | AppRoute) => {
    const path = typeof target === 'string' ? target : buildPath(target);
    const nextRoute = typeof target === 'string' ? parseRoute(target) : target;

    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', path);
    }
    setRoute(nextRoute);
  }, []);

  const back = useCallback(() => {
    if (typeof window !== 'undefined' && window.history) {
      window.history.back();
    }
  }, []);

  const contextValue = useMemo<NavigationContextValue>(
    () => ({
      route,
      navigate,
      replace,
      back,
    }),
    [route, navigate, replace, back]
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
