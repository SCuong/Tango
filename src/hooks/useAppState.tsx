/**
 * Tango — Application State Context & React Bridge
 *
 * Governed by:
 * - docs/ARCHITECTURE.md (§§2, 4)
 * - docs/DATA_MODEL.md (§4)
 * - docs/DESIGN_SYSTEM.md (§§8, 9)
 */

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
  type FC,
  type ReactNode,
} from 'react';
import { UserPreferences, UserStudyState } from '../types';
import {
  saveBooks,
  saveHistory,
  saveLessons,
  savePreferences,
  saveProgress,
} from '../lib/storage';
import {
  loadUserStudyState,
  mergePreferences,
  applyDocumentPreferences,
} from '../lib/appState';

/**
 * Public minimal interface exposed by useAppState.
 */
export type StudyDataPatch = Partial<
  Pick<UserStudyState, 'books' | 'lessons' | 'progressByItem' | 'recentResults'>
>;

export interface AppStateContextValue {
  state: UserStudyState;
  reloadState: () => void;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  /**
   * Persists the given partitions (each to its own storage key) and then updates in-memory
   * state. A failed write (e.g. QuotaExceededError) throws before state changes.
   */
  commitStudyData: (patch: StudyDataPatch) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export interface AppStateProviderProps {
  initialState: UserStudyState;
  children: ReactNode;
}

/**
 * Application state provider.
 *
 * Receives the already-bootstrapped initial `UserStudyState` to ensure that
 * cold-start library seed initialization never executes as a React render side-effect,
 * preserving clean React.StrictMode compatibility.
 */
export const AppStateProvider: FC<AppStateProviderProps> = ({
  initialState,
  children,
}) => {
  const [state, setState] = useState<UserStudyState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const reloadState = useCallback(() => {
    const freshState = loadUserStudyState();
    applyDocumentPreferences(freshState.preferences);
    stateRef.current = freshState;
    setState(freshState);
  }, []);

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    const current = stateRef.current.preferences;
    const nextPreferences = mergePreferences(current, patch);

    // 1. Persist the complete updated preferences first
    // If savePreferences throws (e.g. QuotaExceededError), state update is aborted
    savePreferences(nextPreferences);

    // 2. Synchronize theme and language to document root
    applyDocumentPreferences(nextPreferences);

    // 3. Synchronously update ref before scheduling React state update
    const nextState: UserStudyState = {
      ...stateRef.current,
      preferences: nextPreferences,
    };
    stateRef.current = nextState;

    // 4. Update in-memory state only after persistence write succeeds
    setState(nextState);
  }, []);

  const commitStudyData = useCallback((patch: StudyDataPatch) => {
    if (patch.books) saveBooks(patch.books);
    if (patch.lessons) saveLessons(patch.lessons);
    if (patch.progressByItem) saveProgress(patch.progressByItem);
    if (patch.recentResults) saveHistory(patch.recentResults);

    const nextState: UserStudyState = { ...stateRef.current, ...patch };
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const contextValue = useMemo<AppStateContextValue>(
    () => ({
      state,
      reloadState,
      updatePreferences,
      commitStudyData,
    }),
    [state, reloadState, updatePreferences, commitStudyData]
  );

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};

/**
 * Hook to access the application runtime state and preferences manager.
 * Must be used within an <AppStateProvider>.
 */
export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
