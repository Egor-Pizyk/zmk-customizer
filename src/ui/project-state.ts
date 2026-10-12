import { BINDINGS_CATALOG } from '../catalog/bindings-catalog';
import type { Project, ValidationIssue } from '../domain/types';
import { getControllerBoard } from '../catalog/get-controller-board';
import { analyzeProject } from '../domain/analyze-project';
import type { ProjectFileError } from '../storage/parse-project-file';
import { backupDamagedProject, discardBackup, saveProject } from '../storage/project-storage';
import type {
  DamageReason,
  ProjectLoadResult,
  StorageError,
  SaveError,
} from '../storage/project-storage';
import { reduceProjectHistory } from './project-history';
import { formatIssueCount } from './shell/workspace-issue';
import type { ProjectHistory, ProjectHistoryAction } from './project-history';

export type SaveStatus = 'saved' | StorageError | 'backup-blocked' | 'invalid-project';

/** `id` changes on every announcement so StatusMessage re-announces a repeated text (R15). */
export type Announcement = { readonly text: string; readonly id: number };

export type ProjectState = {
  readonly history: ProjectHistory;
  readonly saveError: SaveError | undefined;
  /** The damaged stored value is not copied aside yet, so the main key must not be written (R7). */
  readonly isAutosaveBlocked: boolean;
  readonly announcement: Announcement | undefined;
  readonly rejectedFile: ProjectFileError | undefined;
  /** Kept damaged data; `origin` says whether it was found on this visit (R7). */
  readonly backup: KeptBackup | undefined;
};

export type KeptBackup = {
  readonly text: string;
  readonly origin: 'now' | 'earlier';
  /** Why the main value could not be read; describes the backup only when origin is 'now'. */
  readonly reason: DamageReason | undefined;
};

function createKeptBackup(initialLoad: ProjectLoadResult): KeptBackup | undefined {
  const { status, backupText } = initialLoad;
  if (backupText === undefined) {
    return undefined;
  }
  const isFoundNow = status.kind === 'damaged' && !status.isBackupBlocked;
  return {
    text: backupText,
    origin: isFoundNow ? 'now' : 'earlier',
    reason: status.kind === 'damaged' ? status.reason : undefined,
  };
}

export function createInitialState(initialLoad: ProjectLoadResult): ProjectState {
  const { status } = initialLoad;
  return {
    history: { past: [], present: initialLoad.project, future: [] },
    saveError: status.kind === 'unavailable' ? { kind: 'storage-unavailable' } : undefined,
    isAutosaveBlocked: status.kind === 'damaged' && status.isBackupBlocked,
    announcement: undefined,
    rejectedFile: undefined,
    backup: createKeptBackup(initialLoad),
  };
}

export function withAnnouncement(state: ProjectState, text: string): ProjectState {
  const id = (state.announcement?.id ?? 0) + 1;
  return { ...state, announcement: { text, id } };
}

function autosave(state: ProjectState, project: Project): SaveError | undefined {
  if (state.isAutosaveBlocked) {
    return state.saveError;
  }
  const saved = saveProject(project);
  return saved.ok ? undefined : saved.error;
}

// Validation cache (perf): one commit ran validateProject 3 times (before + after here,
// plus the provider's useMemo on the same after object). Projects are immutable and shared
// by reference through history, so a WeakMap keeps exactly one real run per new project.
const analysisByProject = new WeakMap<Project, ReturnType<typeof analyzeProject>>();

export function getProjectAnalysis(project: Project): ReturnType<typeof analyzeProject> {
  const cached = analysisByProject.get(project);
  if (cached !== undefined) {
    return cached;
  }
  const board = getControllerBoard(project.controllerId);
  const analysis = analyzeProject(project, {
    bindingsCatalog: BINDINGS_CATALOG,
    target: { ...board, boardId: board.id },
    board,
  });
  analysisByProject.set(project, analysis);
  return analysis;
}

export function getValidationIssues(project: Project): readonly ValidationIssue[] {
  return getProjectAnalysis(project).issues;
}

// One text per change: the action's own text, plus the issue total when it changed (R15).
function describeChange(input: {
  readonly before: Project;
  readonly after: Project;
  readonly announcementText: string | undefined;
}): string | undefined {
  const countBefore = getValidationIssues(input.before).length;
  const countAfter = getValidationIssues(input.after).length;
  if (countBefore === countAfter) {
    return input.announcementText;
  }
  const countText = formatIssueCount(countAfter);
  return input.announcementText === undefined
    ? countText
    : `${input.announcementText}. ${countText}`;
}

// Autosave runs here, in the handler that changes the project, as preferences-context does, so
// loading never writes and no effect copies state (research R6).
export function applyHistoryAction(
  state: ProjectState,
  input: { readonly action: ProjectHistoryAction; readonly announcementText?: string },
): ProjectState {
  const history = reduceProjectHistory(state.history, input.action);
  if (history === state.history) {
    return state;
  }
  const next: ProjectState = { ...state, history, saveError: autosave(state, history.present) };
  const text = describeChange({
    before: state.history.present,
    after: history.present,
    announcementText: input.announcementText,
  });
  return text === undefined ? next : withAnnouncement(next, text);
}

export function getSaveStatus(state: ProjectState): SaveStatus {
  if (state.isAutosaveBlocked) {
    return 'backup-blocked';
  }
  return state.saveError?.kind === 'storage-unavailable'
    ? 'unavailable'
    : (state.saveError?.kind ?? 'saved');
}

export type ProjectStateChange = (change: (latest: ProjectState) => ProjectState) => void;

export function createHistoryActions(update: ProjectStateChange) {
  function dispatch(action: ProjectHistoryAction, announcementText?: string) {
    update((latest) =>
      applyHistoryAction(
        latest,
        announcementText === undefined ? { action } : { action, announcementText },
      ),
    );
  }
  return {
    /** `announcementText` is spoken with the issue count, e.g. "Deleted key 3. Undo" (admin-ui.md). */
    commit: (change: (project: Project) => Project, announcementText?: string) => {
      dispatch({ kind: 'commit', update: change }, announcementText);
    },
    undo: () => {
      dispatch({ kind: 'undo' }, 'Undone');
    },
    redo: () => {
      dispatch({ kind: 'redo' }, 'Redone');
    },
  };
}

// Discard after confirmation. While blocked, the untouched damaged main value is copied into the
// freed slot before autosave resumes, so no damaged value is lost (research R7, SC-004).
export function discardKeptBackup(state: ProjectState): ProjectState {
  if (!discardBackup().ok) {
    return withAnnouncement(state, 'Could not discard the damaged data.');
  }
  if (!state.isAutosaveBlocked) {
    return { ...state, backup: undefined };
  }
  const copied = backupDamagedProject();
  if (!copied.ok) {
    const next = { ...state, backup: undefined };
    return withAnnouncement(next, 'Could not keep the damaged data aside; autosave stays off.');
  }
  const reason = state.backup?.reason;
  return {
    ...state,
    isAutosaveBlocked: false,
    backup: { text: copied.value, origin: 'now', reason },
  };
}
