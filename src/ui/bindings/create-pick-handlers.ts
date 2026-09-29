import { setBindings } from '../../domain/set-bindings';
import { setKeycode } from '../../domain/set-keycode';
import type { Project } from '../../domain/types';
import { toBasicHandlers } from './basic-pick-handlers';
import { handleModMorphPick, toModMorphControls } from './mod-morph-handlers';
import { handleTapDancePick, toTapDanceControls } from './tap-dance-handlers';
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
    modMorph: toModMorphControls({ picker, target, selectionName, commit }),
    ...toBasicHandlers(options),
    handlePick: (item: PickerItem) => {
      handleItemPick({ picker, target, selectionName, commit, onPicked: options.onPicked, item });
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
  if (handleTapDancePick({ ...input, item }) || handleModMorphPick({ ...input, item })) {
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
  picker.setEditingMorphSide(undefined);
  input.onPicked();
}

export type PickHandlers = ReturnType<typeof createPickHandlers>;
