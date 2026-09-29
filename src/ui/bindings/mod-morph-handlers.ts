import { setModMorphBinding } from '../../domain/set-mod-morph-binding';
import { setModMorphKeys } from '../../domain/set-mod-morph-keys';
import { setModMorphMods } from '../../domain/set-mod-morph-mods';
import type { Project } from '../../domain/types';
import type { ModMorphControls } from './mod-morph-options';
import type { TapDanceTarget } from './tap-dance-handlers';
import type { PickerItem, PickerPick } from './to-picker-item';
import type { KeyPickerState } from './use-key-picker';

type ModMorphCommit = (change: (project: Project) => Project, announcementText?: string) => void;

type ModMorphPickInput = {
  readonly picker: KeyPickerState;
  readonly target: TapDanceTarget;
  readonly selectionName: string;
  readonly commit: ModMorphCommit;
  readonly onPicked: () => void;
  readonly item: PickerItem;
};

function isModMorphStarter(pick: PickerPick): boolean {
  return pick.kind === 'binding' && pick.binding.kind === 'mod_morph';
}

// The System tab starter seeds each key from the key it sends; re-picking a key while a side
// is armed writes that side. Returns whether the pick was consumed (spec 005 US3).
export function handleModMorphPick(input: ModMorphPickInput): boolean {
  const { picker, target, selectionName, commit, item } = input;
  if (isModMorphStarter(item.pick)) {
    commit((current) => setModMorphBinding(current, target), `${selectionName}: Mod-morph`);
    picker.setPendingModifiers([]);
    picker.setEditingTap(undefined);
    picker.setEditingMorphSide(undefined);
    input.onPicked();
    return true;
  }
  return handleMorphSidePick({ ...input, pick: item.pick });
}

function handleMorphSidePick(
  input: Omit<ModMorphPickInput, 'item'> & { readonly pick: PickerPick },
): boolean {
  const { picker, target, selectionName, commit, pick } = input;
  const shared = picker.shared;
  const side = picker.editingMorphSide;
  if (
    pick.kind !== 'keycode' ||
    shared.kind !== 'same' ||
    shared.binding.kind !== 'mod_morph' ||
    side === undefined
  ) {
    return false;
  }
  const stroke = { keycode: pick.keycode, modifiers: [...picker.pendingModifiers] };
  const keys =
    side === 'normal'
      ? { normal: stroke, morphed: shared.binding.morphed }
      : { normal: shared.binding.normal, morphed: stroke };
  commit(
    (current) => setModMorphKeys(current, { ...target, ...keys }),
    `${selectionName}: ${side}`,
  );
  picker.setPendingModifiers([]);
  picker.setEditingTap(undefined);
  picker.setEditingMorphSide(undefined);
  input.onPicked();
  return true;
}

type ModMorphControlsInput = {
  readonly picker: KeyPickerState;
  readonly target: TapDanceTarget;
  readonly selectionName: string;
  readonly commit: ModMorphCommit;
};

// Parameter controls for the shared mod-morph; nothing when the selection shares another action.
export function toModMorphControls(
  input: Omit<ModMorphControlsInput, 'binding'>,
): ModMorphControls | undefined {
  const shared = input.picker.shared;
  if (shared.kind !== 'same' || shared.binding.kind !== 'mod_morph') {
    return undefined;
  }
  const { target, selectionName, commit, picker } = input;
  const binding = shared.binding;
  return {
    binding,
    editingSide: picker.editingMorphSide,
    handleArmSide: (side) => {
      picker.setEditingMorphSide(side);
    },
    handleSideModifiersChange: (side, modifiers) => {
      const normal =
        side === 'normal' ? { ...binding.normal, modifiers: [...modifiers] } : binding.normal;
      const morphed =
        side === 'morphed' ? { ...binding.morphed, modifiers: [...modifiers] } : binding.morphed;
      commit(
        (current) => setModMorphKeys(current, { ...target, normal, morphed }),
        `${selectionName}: ${side} modifiers`,
      );
    },
    handleTriggerModifiersChange: (modifiers) => {
      commit(
        (current) => setModMorphMods(current, { ...target, mods: [...modifiers] }),
        `${selectionName}: triggers`,
      );
    },
  };
}
