import { usePreferences } from '../preferences-context';
import { getWorkspaceLabel } from '../workspaces';
import { toIssueTargetPreferences } from './workspace-issue';
import type { WorkspaceIssue } from './workspace-issue';

type IssueButtonProps = {
  readonly issue: WorkspaceIssue;
};

// Activating an issue focuses the control that owns its path (admin-ui.md "Validation display").
export function IssueButton({ issue }: IssueButtonProps) {
  const { changePreferences } = usePreferences();

  // `~=` because one control may own several paths (a board pin select: the end and its pin).
  // The target may not be rendered yet: switch to its workspace and open the Schematic parts
  // list or the issue's layer first, then focus on the next frame (spec 003 FR-025, spec 007).
  function handleClick() {
    const selector = `[data-issue-path~="${issue.path.join('.')}"]`;
    const target = document.querySelector<HTMLElement>(selector);
    if (target !== null) {
      target.focus();
      return;
    }
    changePreferences(toIssueTargetPreferences(issue));
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(selector)?.focus();
    });
  }

  return (
    <button
      className="rounded-md px-1 text-left hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      onClick={handleClick}
      type="button"
    >
      <span className="font-medium">{getWorkspaceLabel(issue.workspaceId)}</span>
      {`: ${issue.message}`}
    </button>
  );
}
