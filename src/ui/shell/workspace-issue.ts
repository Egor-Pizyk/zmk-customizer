import type { WorkspaceId } from '../../storage/preferences';

// observability.md issue shape plus the workspace it belongs to.
export type WorkspaceIssue = {
  readonly code: string;
  readonly message: string;
  readonly path: readonly (string | number)[];
  readonly workspaceId: WorkspaceId;
};

// No checks exist in spec 001; later features replace this with derived validation issues.
export const NO_ISSUES: readonly WorkspaceIssue[] = [];

export const ISSUES_PANEL_ID = 'issues-panel';

export function formatIssueCount(count: number): string {
  if (count === 0) {
    return 'No problems';
  }
  return count === 1 ? '1 problem' : `${count} problems`;
}
