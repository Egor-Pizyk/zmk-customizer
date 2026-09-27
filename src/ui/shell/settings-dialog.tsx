import { useState } from 'react';
import type { Theme } from '../../storage/preferences';
import { Button } from '../components/button';
import { Dialog } from '../components/dialog';
import { RadioGroup } from '../components/radio-group';
import type { RadioOption } from '../components/radio-group';
import { Switch } from '../components/switch';
import { usePreferences } from '../preferences-context';
import { GridSizeField } from './grid-size-field';

const THEME_OPTIONS: readonly RadioOption<Theme>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

type SettingsDialogProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

// Every change applies at once; there is no save button (FR-015).
export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { preferences, storageStatus, changePreferences, resetSettings } = usePreferences();
  const [resetCount, setResetCount] = useState(0);

  function handleClose() {
    onClose();
  }

  function handleThemeChange(theme: Theme) {
    changePreferences({ theme });
  }

  function handleResetClick() {
    resetSettings();
    setResetCount(resetCount + 1);
  }

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Settings">
      {storageStatus === 'unavailable' ? (
        <p className="rounded-md border border-warning p-2 text-warning">
          Settings can&apos;t be saved in this browser and will reset when you close the tab.
        </p>
      ) : undefined}
      <RadioGroup
        label="Theme"
        onChange={handleThemeChange}
        options={THEME_OPTIONS}
        value={preferences.theme}
      />
      <GridSizeField key={resetCount} />
      <DisplaySwitches />
      <Button className="self-start" onClick={handleResetClick} variant="secondary">
        Reset to defaults
      </Button>
    </Dialog>
  );
}

function DisplaySwitches() {
  const { preferences, changePreferences } = usePreferences();

  function handleGridChange(isGridVisible: boolean) {
    changePreferences({ isGridVisible });
  }

  function handleSnapChange(isSnapEnabled: boolean) {
    changePreferences({ isSnapEnabled });
  }

  function handleRulersChange(areRulersVisible: boolean) {
    changePreferences({ areRulersVisible });
  }

  function handleMinimapChange(isMinimapVisible: boolean) {
    changePreferences({ isMinimapVisible });
  }

  return (
    <div className="flex flex-col gap-1">
      <Switch isChecked={preferences.isGridVisible} label="Show grid" onChange={handleGridChange} />
      <Switch
        isChecked={preferences.isSnapEnabled}
        label="Snap to grid"
        onChange={handleSnapChange}
      />
      <Switch
        isChecked={preferences.areRulersVisible}
        label="Show rulers"
        onChange={handleRulersChange}
      />
      <Switch
        isChecked={preferences.isMinimapVisible}
        label="Show minimap"
        onChange={handleMinimapChange}
      />
    </div>
  );
}
