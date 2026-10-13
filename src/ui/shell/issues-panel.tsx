import { useId } from 'react';
import { IconButton, CloseIcon } from '@ui/components';
import { usePreferences } from '@ui/preferences';
import { useProject } from '@ui/project';
import { IssueButton } from './issue-button';
import { ISSUES_PANEL_ID } from '@ui/issues';

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
