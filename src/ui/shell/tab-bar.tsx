import type { WorkspaceId } from '@storage/preferences';
import { IconButton, HelpIcon, SettingsIcon, Badge } from '@ui/components';
import { usePreferences } from '@ui/preferences';
import { WORKSPACES } from '@ui/navigation';
import { useProject } from '@ui/project';
import { formatIssueCount } from '@ui/issues';
import { WorkspaceTab } from './workspace-tab';

type TabBarProps = {
  readonly onSettingsClick: () => void;
  readonly onHelpClick: () => void;
};

export function TabBar({ onSettingsClick, onHelpClick }: TabBarProps) {
  const { preferences, changePreferences } = usePreferences();
  const { issues } = useProject();

  function handleTabSelect(activeWorkspaceId: WorkspaceId) {
    changePreferences({ activeWorkspaceId });
  }

  function handleSettingsClick() {
    onSettingsClick();
  }

  function handleHelpClick() {
    onHelpClick();
  }

  return (
    <nav
      aria-label="Workspaces"
      className="flex w-12 shrink-0 flex-col gap-1 border-r border-border bg-surface-muted p-2 lg:w-44"
    >
      {WORKSPACES.map((workspace) => {
        const issueCount = issues.filter((issue) => issue.workspaceId === workspace.id).length;
        return (
          <WorkspaceTab
            accessibleName={tabAccessibleName(workspace.label, issueCount)}
            isCurrent={workspace.id === preferences.activeWorkspaceId}
            key={workspace.id}
            onSelect={handleTabSelect}
            workspace={workspace}
          >
            {issueCount === 0 ? undefined : <Badge count={issueCount} />}
          </WorkspaceTab>
        );
      })}
      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-2 lg:flex-row">
        <IconButton icon={<SettingsIcon />} label="Settings" onClick={handleSettingsClick} />
        <IconButton icon={<HelpIcon />} label="Keyboard shortcuts" onClick={handleHelpClick} />
      </div>
    </nav>
  );
}

// The badge is aria-hidden, so its count is part of the tab name ("Schematic, 2 problems").
function tabAccessibleName(label: string, issueCount: number): string {
  return issueCount === 0 ? label : `${label}, ${formatIssueCount(issueCount)}`;
}
