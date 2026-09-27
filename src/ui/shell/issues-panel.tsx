import { useId } from 'react';
import { IconButton } from '../components/icon-button';
import { CloseIcon } from '../components/icons/close-icon';
import { usePreferences } from '../preferences-context';
import { getWorkspaceLabel } from '../workspaces';
import { ISSUES_PANEL_ID, NO_ISSUES } from './workspace-issue';

export function IssuesPanel() {
  const issues = NO_ISSUES;
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
        <ul className="overflow-auto px-3 pb-3">
          {issues.map((issue) => (
            <li key={`${issue.workspaceId}:${issue.code}:${issue.path.join('.')}`}>
              <span className="font-medium">{getWorkspaceLabel(issue.workspaceId)}</span>
              {`: ${issue.message}`}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
