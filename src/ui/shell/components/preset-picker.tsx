import { useState } from 'react';
import { KEYBOARD_PRESETS } from '@catalog/presets';
import type { PresetBindingMode } from '@domain/project';
import { Button, Field, RadioGroup } from '@ui/components/components';
import { useProject } from '@ui/project/logic';
import { PresetPreview } from './preset-preview';

const BINDING_MODES = [
  { value: 'qwerty', label: 'QWERTY' },
  { value: 'empty', label: 'Empty keymap' },
] as const;

type PresetPickerProps = { readonly onCreated: () => void; readonly onCancel: () => void };

export function PresetPicker({
  onCreated: handleCreated,
  onCancel: handleCancelClick,
}: PresetPickerProps) {
  const { startLayoutPresetProject } = useProject();
  const [presetId, setPresetId] = useState('macropad-9');
  const [bindingMode, setBindingMode] = useState<PresetBindingMode>('qwerty');
  const preset = KEYBOARD_PRESETS.find((entry) => entry.id === presetId);

  function handleCreateClick() {
    if (preset === undefined) {
      return;
    }
    startLayoutPresetProject({ preset, bindingMode });
    handleCreated();
  }

  const handlePresetSelect = setPresetId;
  const handleBindingModeChange = setBindingMode;
  return (
    <section
      aria-label="Keyboard preset library"
      className="flex min-w-0 flex-col gap-4 border-t border-border pt-4"
    >
      <PresetChoice presetId={presetId} onSelect={handlePresetSelect} />
      <RadioGroup
        label="Starting keymap"
        onChange={handleBindingModeChange}
        options={BINDING_MODES}
        value={bindingMode}
      />
      {preset === undefined ? undefined : <PresetPreview preset={preset} />}
      <CreationActions
        isDisabled={preset === undefined}
        onCreate={handleCreateClick}
        onCreated={handleCreated}
        onCancel={handleCancelClick}
      />
    </section>
  );
}

function PresetChoice({
  presetId,
  onSelect,
}: {
  readonly presetId: string;
  readonly onSelect: (id: string) => void;
}) {
  return (
    <Field
      label="Keyboard preset"
      renderControl={(controlProps) => (
        <select
          {...controlProps}
          className="h-8 w-full min-w-0 rounded-md border border-border-strong bg-surface px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          onChange={(event) => {
            onSelect(event.target.value);
          }}
          value={presetId}
        >
          {KEYBOARD_PRESETS.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name} · {entry.keys.length} keys
            </option>
          ))}
        </select>
      )}
    />
  );
}

type CreationActionsProps = {
  readonly isDisabled: boolean;
  readonly onCreate: () => void;
  readonly onCreated: () => void;
  readonly onCancel: () => void;
};

function CreationActions({ isDisabled, onCreate, onCreated, onCancel }: CreationActionsProps) {
  const { startNewProject } = useProject();
  function handleCreateClick() {
    onCreate();
  }
  function handleEmptyClick() {
    startNewProject();
    onCreated();
  }
  function handleCancelClick() {
    onCancel();
  }
  return (
    <div className="grid auto-rows-fr gap-2" aria-label="New project actions">
      <Button
        className="w-full"
        isDisabled={isDisabled}
        onClick={handleCreateClick}
        variant="primary"
      >
        Create project from preset
      </Button>
      <Button className="w-full" onClick={handleEmptyClick} variant="secondary">
        Start empty project
      </Button>
      <Button className="w-full" onClick={handleCancelClick} variant="danger">
        Cancel
      </Button>
    </div>
  );
}
