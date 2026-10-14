import { useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ProjectLoadResult } from '@storage/project';
import {
  createHistoryActions,
  getSaveStatus,
  getProjectAnalysis,
  getValidationIssues,
  withAnnouncement,
  createFileActions,
  ProjectContext,
  useProjectState,
} from '@ui/project/logic';

import { toWorkspaceIssues } from '@ui/issues';

import type { ProjectContextValue } from '@ui/project/logic';

type ProjectProviderProps = {
  /** Loaded once in main.tsx before render; loading may write the backup (research R7). */
  readonly initialLoad: ProjectLoadResult;
  readonly children: ReactNode;
};

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
