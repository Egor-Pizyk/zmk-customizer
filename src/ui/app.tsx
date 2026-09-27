import { usePreferences } from './preferences-context';
import { IssuesAnnouncer } from './shell/issues-announcer';
import { IssuesPanel } from './shell/issues-panel';
import { ProjectBar } from './shell/project-bar';
import { SettingsDialog } from './shell/settings-dialog';
import { ShortcutHelpDialog } from './shell/shortcut-help-dialog';
import { TabBar } from './shell/tab-bar';
import { useGlobalShortcuts } from './use-global-shortcuts';
import { useShellDialogs } from './use-shell-dialogs';
import { WorkspaceView } from './workspace-view';

export function App() {
  const { activeWorkspaceId, isIssuesPanelOpen } = usePreferences().preferences;
  const dialogs = useShellDialogs();
  useGlobalShortcuts(dialogs);

  return (
    <div className="flex h-dvh">
      <SkipLink />
      <TabBar onHelpClick={dialogs.handleHelpOpen} onSettingsClick={dialogs.handleSettingsOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <ProjectBar />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto" id="main">
          <WorkspaceView workspaceId={activeWorkspaceId} />
        </main>
        {isIssuesPanelOpen ? <IssuesPanel /> : undefined}
      </div>
      <IssuesAnnouncer />
      <SettingsDialog isOpen={dialogs.isSettingsOpen} onClose={dialogs.handleSettingsClose} />
      <ShortcutHelpDialog isOpen={dialogs.isHelpOpen} onClose={dialogs.handleHelpClose} />
    </div>
  );
}

function SkipLink() {
  return (
    <a
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30 focus:rounded-md focus:bg-surface-raised focus:p-2"
      href="#main"
    >
      Skip to main content
    </a>
  );
}
