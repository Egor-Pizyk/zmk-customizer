import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { Field, INPUT_CLASSES } from '@ui/components';
import { usePreferences } from '@ui/preferences';
import { GRID_PRESETS_U, parseGridSizeInput } from './grid-size';

const CUSTOM_PRESET = 'custom';

export function GridSizeField() {
  const { preferences, changePreferences } = usePreferences();
  const { gridSizeU } = preferences;
  const editor = useGridSizeDraft(gridSizeU, changePreferences);
  const presetValue = GRID_PRESETS_U.includes(gridSizeU) ? String(gridSizeU) : CUSTOM_PRESET;

  function handlePresetChange(presetU: number) {
    changePreferences({ gridSizeU: presetU });
    editor.clear();
  }

  return (
    <div className="flex items-start gap-2">
      <GridPresetSelect onPresetChange={handlePresetChange} value={presetValue} />
      <Field
        error={editor.error}
        label="Grid size (u)"
        renderControl={(controlProps) => (
          <input
            {...controlProps}
            className={INPUT_CLASSES}
            inputMode="decimal"
            onBlur={editor.handleBlur}
            onChange={editor.handleChange}
            onKeyDown={editor.handleKeyDown}
            type="text"
            value={editor.text}
          />
        )}
      />
    </div>
  );
}

// The draft exists only while the user edits; outside an edit the stored value is shown (R15).
type GridSizeDraft = {
  readonly text: string;
  readonly error?: string;
};

function useGridSizeDraft(
  gridSizeU: number,
  changePreferences: (changes: { gridSizeU: number }) => void,
) {
  const [draft, setDraft] = useState<GridSizeDraft | undefined>();

  function clear() {
    setDraft(undefined);
  }

  function commit() {
    if (draft === undefined) {
      return;
    }
    const result = parseGridSizeInput(draft.text);
    if (result.isValid) {
      changePreferences({ gridSizeU: result.value });
      clear();
    } else {
      setDraft({ text: draft.text, error: result.message });
    }
  }

  return {
    text: draft?.text ?? String(gridSizeU),
    error: draft?.error,
    clear,
    handleBlur: commit,
    handleChange: (event: ChangeEvent<HTMLInputElement>) => {
      setDraft({ text: event.target.value });
    },
    // Escape reverts a dirty draft and keeps the dialog open; otherwise it closes the dialog.
    handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        commit();
      }
      if (event.key === 'Escape' && draft !== undefined) {
        event.preventDefault();
        clear();
      }
    },
  };
}

type GridPresetSelectProps = {
  readonly value: string;
  readonly onPresetChange: (presetU: number) => void;
};

function GridPresetSelect({ value, onPresetChange }: GridPresetSelectProps) {
  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    if (event.target.value !== CUSTOM_PRESET) {
      onPresetChange(Number(event.target.value));
    }
  }

  return (
    <Field
      label="Grid preset"
      renderControl={(controlProps) => (
        <select {...controlProps} className={INPUT_CLASSES} onChange={handleChange} value={value}>
          {GRID_PRESETS_U.map((presetU) => (
            <option key={presetU} value={String(presetU)}>{`${presetU}u`}</option>
          ))}
          <option value={CUSTOM_PRESET}>Custom</option>
        </select>
      )}
    />
  );
}
