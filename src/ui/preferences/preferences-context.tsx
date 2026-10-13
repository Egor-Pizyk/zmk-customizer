import { createContext, use, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from '@storage/preferences';
import type {
  Preferences,
  PreferencesLoadResult,
  PreferencesLoadStatus,
} from '@storage/preferences';

export type PreferencesChange =
  | Partial<Preferences>
  | ((latest: Preferences) => Partial<Preferences>);

type PreferencesContextValue = {
  readonly preferences: Preferences;
  readonly storageStatus: PreferencesLoadStatus;
  /** Merges into the latest state, not the caller's render snapshot (timers, gestures). */
  readonly changePreferences: (change: PreferencesChange) => void;
  /** Resets the fields shown in the settings dialog only (FR-018). */
  readonly resetSettings: () => void;
};

const SETTINGS_DEFAULTS: Partial<Preferences> = {
  theme: DEFAULT_PREFERENCES.theme,
  gridSizeU: DEFAULT_PREFERENCES.gridSizeU,
  isGridVisible: DEFAULT_PREFERENCES.isGridVisible,
  isSnapEnabled: DEFAULT_PREFERENCES.isSnapEnabled,
  areRulersVisible: DEFAULT_PREFERENCES.areRulersVisible,
};

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

type PreferencesProviderProps = {
  readonly children: ReactNode;
};

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [state, setState] = useState<PreferencesLoadResult>(loadPreferences);
  // Written only from event handlers (changePreferences), never during render.
  const latestRef = useRef(state);

  const value = useMemo<PreferencesContextValue>(() => {
    // Loading never writes; only user changes do, so a corrupt value survives until then (FR-029).
    function changePreferences(change: PreferencesChange) {
      const latest = latestRef.current;
      const changes = typeof change === 'function' ? change(latest.preferences) : change;
      const preferences = { ...latest.preferences, ...changes };
      const isSaved = latest.status !== 'unavailable' && savePreferences(preferences);
      latestRef.current = { preferences, status: isSaved ? 'ok' : 'unavailable' };
      setState(latestRef.current);
    }
    return {
      preferences: state.preferences,
      storageStatus: state.status,
      changePreferences,
      resetSettings: () => {
        changePreferences(SETTINGS_DEFAULTS);
      },
    };
  }, [state]);

  const { theme } = state.preferences;
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      delete root.dataset['theme'];
      return;
    }
    root.dataset['theme'] = theme;
  }, [theme]);

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences(): PreferencesContextValue {
  const value = use(PreferencesContext);
  if (value === undefined) {
    throw new Error('usePreferences must be used inside PreferencesProvider');
  }
  return value;
}
