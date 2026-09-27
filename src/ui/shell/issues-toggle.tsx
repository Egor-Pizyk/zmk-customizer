import { Button } from '../components/button';
import { usePreferences } from '../preferences-context';
import { useProject } from '../project-context';
import { ISSUES_PANEL_ID } from './workspace-issue';

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
