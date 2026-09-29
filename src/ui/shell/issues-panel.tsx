import { useId } from 'react';
import { IconButton } from '../components/icon-button';
import { CloseIcon } from '../components/icons/close-icon';
import { usePreferences } from '../preferences-context';
import { getWorkspaceLabel } from '../workspaces';
import { useProject } from '../project-context';
import { ISSUES_PANEL_ID } from './workspace-issue';
import type { WorkspaceIssue } from './workspace-issue';

export function IssuesPanel() {
  const { issues } = useProject();
  const { changePreferences } = usePreferences();
  const headingId = useId();

  // The close button unmounts with the panel; focus goes back to the toggle that opened it.
  function handleCloseClick() {
    changePreferences({ isIssuesPanelOpen: false });
    document.querySelector<HTMLElement>(`[aria-controls="${ISSUES_PANEL_ID}"]`)?.focus();
  }

  return (
    <section
      aria-labelledby={headingId}
      className="flex max-h-48 shrink-0 flex-col border-t border-border bg-surface-raised"
      id={ISSUES_PANEL_ID}
    >
      <div className="flex items-center justify-between px-3 py-1">
        <h2 className="font-semibold" id={headingId}>
          Problems
        </h2>
        <IconButton icon={<CloseIcon />} label="Close problems" onClick={handleCloseClick} />
      </div>
      {issues.length === 0 ? (
        <p className="px-3 pb-3 text-text-muted">No problems</p>
      ) : (
        <ul className="overflow-auto overscroll-contain px-3 pb-3">
          {issues.map((issue) => (
            <li key={`${issue.workspaceId}:${issue.code}:${issue.path.join('.')}`}>
              <IssueButton issue={issue} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type IssueButtonProps = {
  readonly issue: WorkspaceIssue;
};

// Activating an issue focuses the control that owns its path (admin-ui.md "Validation display").
function IssueButton({ issue }: IssueButtonProps) {
  const { changePreferences } = usePreferences();

  // `~=` because one control may own several paths (a board pin select: the end and its pin).
  // The target may not be rendered yet: switch to its workspace and open the Schematic parts
  // list first, then focus on the next frame (spec 003 FR-025).
  function handleClick() {
    const selector = `[data-issue-path~="${issue.path.join('.')}"]`;
    const target = document.querySelector<HTMLElement>(selector);
    if (target !== null) {
      target.focus();
      return;
    }
    // The Schematic target lives in the parts list; Bindings keycaps are always rendered.
    changePreferences(
      issue.workspaceId === 'schematic'
        ? { activeWorkspaceId: issue.workspaceId, isPartsListOpen: true }
        : { activeWorkspaceId: issue.workspaceId },
    );
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
