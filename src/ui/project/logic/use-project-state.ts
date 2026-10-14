import { useCallback, useMemo, useRef, useState } from 'react';
import type { ProjectLoadResult } from '@storage/project';
import { createImportSession } from './import-session';
import { createInitialState } from './project-state';
import type { ProjectState } from './project-state';

// Changes apply to the latest state, not the render snapshot, like preferences-context.
export function useProjectState(initialLoad: ProjectLoadResult) {
  const [state, setState] = useState(() => createInitialState(initialLoad));
  // Written only from event handlers, never during render.
  const latestRef = useRef(state);
  const importSession = useMemo(() => createImportSession(), []);
  // Stable so the context value below only changes with state.
  const change = useCallback(
    (apply: (latest: ProjectState) => ProjectState) => {
      const before = latestRef.current.history.present;
      latestRef.current = apply(latestRef.current);
      if (latestRef.current.history.present !== before) {
        importSession.invalidate();
      }
      setState(latestRef.current);
    },
    [importSession],
  );
  return { state, change, importSession };
}
