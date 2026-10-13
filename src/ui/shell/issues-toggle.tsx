import { Button } from '@ui/components';
import { usePreferences } from '@ui/preferences';
import { useProject } from '@ui/project';
import { ISSUES_PANEL_ID } from '@ui/issues';

export function IssuesToggle() {
  const { preferences, changePreferences } = usePreferences();
  const { issues } = useProject();

  function handleClick() {
    changePreferences({ isIssuesPanelOpen: !preferences.isIssuesPanelOpen });
  }

  return (
    <Button
      aria-controls={ISSUES_PANEL_ID}
      aria-expanded={preferences.isIssuesPanelOpen}
      className="ml-auto"
      onClick={handleClick}
      size="sm"
    >
      {`Problems (${issues.length})`}
    </Button>
  );
}
