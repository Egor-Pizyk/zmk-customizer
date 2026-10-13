import { useState } from 'react';

export type ShellDialogs = ReturnType<typeof useShellDialogs>;

type ShellDialogId = 'settings' | 'help' | 'new-project' | 'open-project' | 'discard-backup';

// Open flags of the shell's modal dialogs: UI state, never project state (002 research R16).
export function useShellDialogs() {
  const [openDialogId, setOpenDialogId] = useState<ShellDialogId | undefined>();

  function opener(dialogId: ShellDialogId) {
    return () => {
      setOpenDialogId(dialogId);
    };
  }

  function handleClose() {
    setOpenDialogId(undefined);
  }

  return {
    isSettingsOpen: openDialogId === 'settings',
    isHelpOpen: openDialogId === 'help',
    isNewDialogOpen: openDialogId === 'new-project',
    isOpenDialogOpen: openDialogId === 'open-project',
    isDiscardDialogOpen: openDialogId === 'discard-backup',
    handleSettingsOpen: opener('settings'),
    handleHelpOpen: opener('help'),
    handleNewDialogOpen: opener('new-project'),
    handleOpenDialogOpen: opener('open-project'),
    handleDiscardDialogOpen: opener('discard-backup'),
    handleSettingsClose: handleClose,
    handleHelpClose: handleClose,
    handleDialogClose: handleClose,
  };
}
