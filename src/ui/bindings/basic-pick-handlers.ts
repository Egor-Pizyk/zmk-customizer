import { MODIFIER_KEYCODES } from '../../catalog/keycodes';
import { setHoldKey } from '../../domain/set-hold-key';
import { setPressMode } from '../../domain/set-press-mode';
import type { PressMode } from '../../domain/set-press-mode';
import type { Modifier, Project } from '../../domain/types';
import { toggleKeyModifier } from './toggle-key-modifier';
import type { KeyPickerState } from './use-key-picker';

export type BasicPickInput = {
  readonly project: Project;
  readonly selectedKeyIds: readonly string[];
  readonly selectionName: string;
  readonly picker: KeyPickerState;
  readonly commit: (change: (project: Project) => Project, announcementText?: string) => void;
};

// Modifier chips, "When held" and press mode for keys that send a key (spec 004 FR-011–FR-012).
export function toBasicHandlers(input: BasicPickInput) {
  const { selectedKeyIds: keyIds, selectionName, commit } = input;
  const target = { layerIndex: 0, keyIds };

  return {
    handleModifierToggle: (modifier: Modifier, isEnabled: boolean) => {
      toggleKeyModifier(input, { modifier, isEnabled });
    },
    handleHoldChange: (holdKeycode: string | undefined) => {
      const hold = MODIFIER_KEYCODES.find((keycode) => keycode.name === holdKeycode);
      const change =
        hold === undefined ? target : { ...target, hold: { keycode: hold.name, modifiers: [] } };
      commit((current) => setHoldKey(current, change), `${selectionName}: hold changed`);
    },
    handleModeChange: (mode: PressMode) => {
      commit((current) => setPressMode(current, { ...target, mode }), `${selectionName}: ${mode}`);
    },
  };
}
