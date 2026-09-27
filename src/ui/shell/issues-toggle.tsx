import { Button } from '../components/button';
import { usePreferences } from '../preferences-context';
import { ISSUES_PANEL_ID, NO_ISSUES } from './workspace-issue';

export function IssuesToggle() {
  const { preferences, changePreferences } = usePreferences();

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
      {`Problems (${NO_ISSUES.length})`}
    </Button>
  );
}
