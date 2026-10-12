import type { ValidationCode, ValidationIssue } from '../../domain/types';
import type { Preferences, WorkspaceId } from '../../storage/preferences';

// observability.md issue shape plus the workspace that fixes it; workspaces are a UI concept, so
// the domain issue has none (002 research R4).
export type WorkspaceIssue = ValidationIssue & { readonly workspaceId: WorkspaceId };

const WORKSPACE_BY_ISSUE_CODE: Record<ValidationCode, WorkspaceId> = {
  'shield-name-empty': 'schematic',
  'shield-name-invalid': 'schematic',
  'keyboard-name-too-long': 'schematic',
  'key-overlap': 'schematic',
  'key-pin-unconnected': 'schematic',
  'wire-end-unconnected': 'schematic',
  'board-pin-conflict': 'schematic',
  'board-pins-shorted': 'schematic',
  'key-shorted': 'schematic',
  'keys-in-parallel': 'schematic',
  'net-without-board-pin': 'schematic',
  'binding-keycode-unknown': 'bindings',
  'binding-profile-out-of-range': 'bindings',
  'binding-tapping-term-out-of-range': 'bindings',
  'binding-mod-morph-same-action': 'bindings',
  'binding-layer-missing': 'bindings',
  'layer-name-empty': 'bindings',
  'layer-name-invalid-character': 'bindings',
  'layer-name-duplicate': 'bindings',
  'layer-count-exceeded': 'bindings',
};

export function toWorkspaceIssues(issues: readonly ValidationIssue[]): readonly WorkspaceIssue[] {
  return issues.map(({ code, message, path }) => ({
    code,
    message,
    path,
    workspaceId: WORKSPACE_BY_ISSUE_CODE[code],
  }));
}

// What must be shown before an issue's target can be focused: Schematic targets live in the parts
// list (spec 003 FR-025), Bindings targets on the issue's layer (spec 007 R6).
export function toIssueTargetPreferences(issue: WorkspaceIssue): Partial<Preferences> {
  if (issue.workspaceId === 'schematic') {
    return { activeWorkspaceId: 'schematic', isPartsListOpen: true };
  }
  const [collection, layerIndex] = issue.path;
  return collection === 'layers' && typeof layerIndex === 'number'
    ? { activeWorkspaceId: issue.workspaceId, bindingsLayerIndex: layerIndex }
    : { activeWorkspaceId: issue.workspaceId };
}

export const ISSUES_PANEL_ID = 'issues-panel';

export function formatIssueCount(count: number): string {
  if (count === 0) {
    return 'No problems';
  }
  return count === 1 ? '1 problem' : `${count} problems`;
}
