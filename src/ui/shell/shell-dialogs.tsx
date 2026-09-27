import type { ShellDialogs as ShellDialogsState } from '../use-shell-dialogs';
import { ProjectDialogs } from './project-dialogs';
import { SettingsDialog } from './settings-dialog';
import { ShortcutHelpDialog } from './shortcut-help-dialog';

type ShellDialogsProps = {
  readonly dialogs: ShellDialogsState;
};

// Every modal dialog of the shell, mounted once by App; open flags live in useShellDialogs.
export function ShellDialogs({ dialogs }: ShellDialogsProps) {
  return (
    <>
      <SettingsDialog isOpen={dialogs.isSettingsOpen} onClose={dialogs.handleSettingsClose} />
      <ShortcutHelpDialog isOpen={dialogs.isHelpOpen} onClose={dialogs.handleHelpClose} />
      <ProjectDialogs
        isDiscardDialogOpen={dialogs.isDiscardDialogOpen}
        isNewDialogOpen={dialogs.isNewDialogOpen}
        isOpenDialogOpen={dialogs.isOpenDialogOpen}
        onClose={dialogs.handleDialogClose}
      />
    </>
  );
}
