import { useState } from 'react';

export function useShellDialogs() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  return {
    isSettingsOpen,
    isHelpOpen,
    handleSettingsOpen: () => {
      setIsSettingsOpen(true);
    },
    handleSettingsClose: () => {
      setIsSettingsOpen(false);
    },
    handleHelpOpen: () => {
      setIsHelpOpen(true);
    },
    handleHelpClose: () => {
      setIsHelpOpen(false);
    },
  };
}
