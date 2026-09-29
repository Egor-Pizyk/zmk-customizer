import { MODIFIER_KEYCODES } from '../../catalog/keycodes';
import { setBindings } from '../../domain/set-bindings';
import { setHoldKey } from '../../domain/set-hold-key';
import { setKeycode } from '../../domain/set-keycode';
import { setPressMode } from '../../domain/set-press-mode';
import type { PressMode } from '../../domain/set-press-mode';
import type { Modifier, Project } from '../../domain/types';
import { handleTapDancePick, toTapDanceControls } from './tap-dance-handlers';
import { toggleKeyModifier } from './toggle-key-modifier';
import type { PickerItem } from './to-picker-item';
import type { KeyPickerState } from './use-key-picker';

type PickHandlerOptions = {
  readonly project: Project;
  readonly selectedKeyIds: readonly string[];
  readonly selectionName: string;
  readonly picker: KeyPickerState;
  readonly commit: (change: (project: Project) => Project, announcementText?: string) => void;
  /** Called after a pick from the picker (auto-advance, FR-014a). */
  readonly onPicked: () => void;
};

// Every pick, chip, hold or mode change is one commit for all selected keys (FR-015).
export function createPickHandlers(options: PickHandlerOptions) {
  const { selectedKeyIds: keyIds, selectionName, picker, commit } = options;
  const target = { layerIndex: 0, keyIds };

  return {
    tapDance: toTapDanceControls({ picker, target, selectionName, commit }),
    handlePick: (item: PickerItem) => {
      handleItemPick({ picker, target, selectionName, commit, onPicked: options.onPicked, item });
    },
    handleModifierToggle: (modifier: Modifier, isEnabled: boolean) => {
      toggleKeyModifier(options, { modifier, isEnabled });
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

type ItemPickInput = {
  readonly picker: KeyPickerState;
  readonly target: { readonly layerIndex: number; readonly keyIds: readonly string[] };
  readonly selectionName: string;
  readonly commit: PickHandlerOptions['commit'];
  readonly onPicked: () => void;
  readonly item: PickerItem;
};

function handleItemPick(input: ItemPickInput) {
  const { picker, target, selectionName, commit, item } = input;
  const handled = handleTapDancePick({ ...input, item });
  if (handled) {
    return;
  }
  const { pick } = item;
  const change =
    pick.kind === 'keycode'
      ? (current: Project) =>
          setKeycode(current, {
            ...target,
            keycode: pick.keycode,
            modifiers: picker.pendingModifiers,
          })
      : (current: Project) => setBindings(current, { ...target, binding: pick.binding });
  commit(change, `${selectionName}: ${item.name}`);
  picker.setPendingModifiers([]);
  picker.setEditingTap(undefined);
  input.onPicked();
}

export type PickHandlers = ReturnType<typeof createPickHandlers>;
