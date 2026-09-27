import type { ValidationCode, ValidationIssue } from '../../domain/types';
import type { WorkspaceId } from '../../storage/preferences';

// observability.md issue shape plus the workspace that fixes it; workspaces are a UI concept, so
// the domain issue has none (002 research R4).
export type WorkspaceIssue = ValidationIssue & { readonly workspaceId: WorkspaceId };

const WORKSPACE_BY_ISSUE_CODE: Record<ValidationCode, WorkspaceId> = {
  'shield-name-empty': 'schematic',
  'shield-name-invalid': 'schematic',
  'keyboard-name-too-long': 'schematic',
};

export function toWorkspaceIssues(issues: readonly ValidationIssue[]): readonly WorkspaceIssue[] {
  return issues.map(({ code, message, path }) => ({
    code,
    message,
    path,
    workspaceId: WORKSPACE_BY_ISSUE_CODE[code],
  }));
}

export const ISSUES_PANEL_ID = 'issues-panel';

export function formatIssueCount(count: number): string {
  if (count === 0) {
    return 'No problems';
  }
  return count === 1 ? '1 problem' : `${count} problems`;
}
