import { createContext, use } from 'react';
import type { Project } from '@domain';
import type { ProjectFileError } from '@storage/project';
import type { WorkspaceIssue } from '@ui/issues';
import type { createImportSession } from './import-session';
import type { createFileActions } from './project-file-actions';
import type {
  createHistoryActions,
  getProjectAnalysis,
  Announcement,
  KeptBackup,
  ProjectState,
  SaveStatus,
} from './project-state';

export type ProjectContextValue = ReturnType<typeof createHistoryActions> &
  ReturnType<typeof createFileActions> & {
    readonly importSession: ReturnType<typeof createImportSession>;
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

export const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function useProject(): ProjectContextValue {
  const value = use(ProjectContext);
  if (value === undefined) {
    throw new Error('useProject must be used inside ProjectProvider');
  }
  return value;
}
