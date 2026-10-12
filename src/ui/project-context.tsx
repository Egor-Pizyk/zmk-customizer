import { createContext, use, useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createImportSession } from './import-session';
import type { Project } from '../domain/types';
import type { ProjectLoadResult } from '../storage/project-storage';
import {
  createHistoryActions,
  createInitialState,
  getSaveStatus,
  getProjectAnalysis,
  getValidationIssues,
  withAnnouncement,
} from './project-state';
import type { Announcement, KeptBackup, ProjectState, SaveStatus } from './project-state';
import { createFileActions } from './project-file-actions';
import type { ProjectFileError } from '../storage/parse-project-file';
import { toWorkspaceIssues } from './shell/workspace-issue';
import type { WorkspaceIssue } from './shell/workspace-issue';

type ProjectContextValue = ReturnType<typeof createHistoryActions> &
  ReturnType<typeof createFileActions> & {
    readonly project: Project;
    readonly analysis: ReturnType<typeof getProjectAnalysis>;
    readonly issues: readonly WorkspaceIssue[];
    readonly rejectedFile: ProjectFileError | undefined;
    readonly backup: KeptBackup | undefined;
    readonly saveStatus: SaveStatus;
    readonly saveError: ProjectState['saveError'];
    readonly announcement: Announcement | undefined;
    readonly announce: (text: string) => void;
    readonly canUndo: boolean;
    readonly canRedo: boolean;
  };

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

type ProjectProviderProps = {
  /** Loaded once in main.tsx before render; loading may write the backup (research R7). */
  readonly initialLoad: ProjectLoadResult;
  readonly children: ReactNode;
};

// Changes apply to the latest state, not the render snapshot, like preferences-context.
function useProjectState(initialLoad: ProjectLoadResult) {
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

export function ProjectProvider({ initialLoad, children }: ProjectProviderProps) {
  const { state, change, importSession } = useProjectState(initialLoad);
  const { present } = state.history;
  // Validation runs once per project change for every consumer (react.md "Project state").
  // getValidationIssues caches by project identity, so the run here is the only real one
  // per commit (perf: describeChange in project-state.ts hits the same cache).
  const issues = useMemo(() => toWorkspaceIssues(getValidationIssues(present)), [present]);

  // Memoized as react/jsx-no-constructed-context-values requires, like preferences-context.
  const value = useMemo<ProjectContextValue>(
    () => ({
      ...createHistoryActions(change),
      ...createFileActions(change, importSession),
      project: present,
      analysis: getProjectAnalysis(present),
      issues,
      rejectedFile: state.rejectedFile,
      backup: state.backup,
      saveStatus: getSaveStatus(state),
      saveError: state.saveError,
      announcement: state.announcement,
      announce: (text) => {
        change((latest) => withAnnouncement(latest, text));
      },
      canUndo: state.history.past.length > 0,
      canRedo: state.history.future.length > 0,
    }),
    [state, change, present, issues, importSession],
  );

  return <ProjectContext value={value}>{children}</ProjectContext>;
}

export function useProject(): ProjectContextValue {
  const value = use(ProjectContext);
  if (value === undefined) {
    throw new Error('useProject must be used inside ProjectProvider');
  }
  return value;
}
