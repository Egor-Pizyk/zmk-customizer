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

export function PresetPicker({ onCreated }: { readonly onCreated: () => void }) {
  const { startLayoutPresetProject } = useProject();
  const [presetId, setPresetId] = useState('macropad-9');
  const [bindingMode, setBindingMode] = useState<PresetBindingMode>('qwerty');
  const preset = KEYBOARD_PRESETS.find((entry) => entry.id === presetId);

  function handleCreateClick() {
    if (preset === undefined) {
      return;
    }
    startLayoutPresetProject({ preset, bindingMode });
    onCreated();
  }

  function handleBindingModeChange(mode: PresetBindingMode) {
    setBindingMode(mode);
  }

  function handlePresetSelect(id: string) {
    setPresetId(id);
  }

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
      <Button isDisabled={preset === undefined} onClick={handleCreateClick} variant="primary">
        Create project from preset
      </Button>
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
