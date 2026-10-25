import type { WorkspaceId } from '@storage/preferences';
import { IconButton, Badge } from '@ui/components/components';
import { HelpIcon, SettingsIcon, ReplayIcon } from '@ui/components/icons';
import { usePreferences } from '@ui/preferences';
import { WORKSPACES } from '@ui/navigation';
import { useProject } from '@ui/project/logic';
import { formatIssueCount } from '@ui/issues';
import { WorkspaceTab } from './workspace-tab';

type TabBarProps = {
  readonly onSettingsClick: () => void;
  readonly onTourClick: () => void;
  readonly onHelpClick: () => void;
};

export function TabBar({
  onSettingsClick: handleSettingsClick,
  onHelpClick: handleHelpClick,
  onTourClick: handleTourClick,
}: TabBarProps) {
  const { preferences, changePreferences } = usePreferences();
  const { issues } = useProject();

  function handleTabSelect(activeWorkspaceId: WorkspaceId) {
    changePreferences({ activeWorkspaceId });
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
      <NavigationFooter
        onSettingsClick={handleSettingsClick}
        onHelpClick={handleHelpClick}
        onTourClick={handleTourClick}
      />
    </nav>
  );
}

// The badge is aria-hidden, so its count is part of the tab name ("Schematic, 2 problems").
function tabAccessibleName(label: string, issueCount: number): string {
  return issueCount === 0 ? label : `${label}, ${formatIssueCount(issueCount)}`;
}

function NavigationFooter({
  onSettingsClick: handleSettingsClick,
  onHelpClick: handleHelpClick,
  onTourClick: handleTourClick,
}: TabBarProps) {
  return (
    <div className="mt-auto flex flex-col gap-1 border-t border-border pt-2 lg:flex-row">
      <IconButton
        data-onboarding-target="settings"
        icon={<SettingsIcon />}
        label="Settings"
        onClick={handleSettingsClick}
      />
      <IconButton icon={<ReplayIcon />} label="Take the tour again" onClick={handleTourClick} />
      <IconButton icon={<HelpIcon />} label="Keyboard shortcuts" onClick={handleHelpClick} />
    </div>
  );
}
