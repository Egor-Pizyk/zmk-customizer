import { useState } from 'react';
import { useProject } from '@ui/project/logic';
import { OnboardingWelcome, OnboardingPanel } from '@ui/onboarding/components';
import { usePreferences } from '@ui/preferences';
import {
  IssuesPanel,
  ProjectBar,
  ProjectMessages,
  ShellDialogs,
  StatusMessage,
  TabBar,
} from '@ui/shell/components';
import { useGlobalShortcuts } from '@ui/app/logic';
import { useShellDialogs } from '@ui/dialogs';
import { WorkspaceView } from './workspace-view';

export function App() {
  const { activeWorkspaceId, isIssuesPanelOpen } = usePreferences().preferences;
  const dialogs = useShellDialogs();
  const { tutorial } = useProject();
  const [tourRequest, setTourRequest] = useState(0);
  useGlobalShortcuts(dialogs);

  return (
    <div className="flex h-dvh">
      <SkipLink />
      <TabBar
        onTourClick={() => {
          setTourRequest(tourRequest + 1);
        }}
        onHelpClick={dialogs.handleHelpOpen}
        onSettingsClick={dialogs.handleSettingsOpen}
      />
      <div className="flex min-w-0 flex-1 flex-col" data-onboarding-target="editor-area">
        <ProjectBar
          onAgentClick={dialogs.handleAgentDialogOpen}
          onNewClick={dialogs.handleNewDialogOpen}
          onOpenClick={dialogs.handleOpenDialogOpen}
        />
        <ProjectMessages onDiscardClick={dialogs.handleDiscardDialogOpen} />
        <main
          data-onboarding-target="workspace"
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto"
          id="main"
        >
          <WorkspaceView workspaceId={activeWorkspaceId} />
        </main>
        {isIssuesPanelOpen ? <IssuesPanel /> : undefined}
        {tutorial === undefined ? undefined : <OnboardingPanel />}
      </div>
      <StatusMessage />
      <ShellDialogs dialogs={dialogs} />
      <OnboardingWelcome isReplay={tourRequest > 0} key={tourRequest} />
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
