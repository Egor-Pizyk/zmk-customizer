import { setBindings } from '../../domain/set-bindings';
import { setTapDanceBinding } from '../../domain/set-tap-dance-binding';
import { setTapDanceTaps } from '../../domain/set-tap-dance-taps';
import { setTappingTerm } from '../../domain/set-tapping-term';
import type { Binding, KeyStroke, Project } from '../../domain/types';
import type { TapDanceControls } from './tap-dance-options';
import type { PickerItem, PickerPick } from './to-picker-item';
import type { KeyPickerState } from './use-key-picker';

export type TapDanceTarget = {
  readonly layerIndex: number;
  readonly keyIds: readonly string[];
};

type TapDanceCommit = (change: (project: Project) => Project, announcementText?: string) => void;

type TapDancePickInput = {
  readonly picker: KeyPickerState;
  readonly target: TapDanceTarget;
  readonly selectionName: string;
  readonly commit: TapDanceCommit;
  readonly onPicked: () => void;
  readonly item: PickerItem;
};

const PLAIN_A: KeyStroke = { keycode: 'A', modifiers: [] };

function isTapDanceStarter(pick: PickerPick): boolean {
  return pick.kind === 'binding' && pick.binding.kind === 'tap_dance';
}

// The System tab starter seeds each key from the key it sends; re-picking a key while a tap
// is armed writes that tap. Returns whether the pick was consumed (spec 005 US2).
export function handleTapDancePick(input: TapDancePickInput): boolean {
  const { picker, target, selectionName, commit, item } = input;
  if (isTapDanceStarter(item.pick)) {
    commit((current) => setTapDanceBinding(current, target), `${selectionName}: Tap dance`);
    picker.setPendingModifiers([]);
    picker.setEditingTap(undefined);
    picker.setEditingMorphSide(undefined);
    input.onPicked();
    return true;
  }
  return handleTapKeyPick({ ...input, pick: item.pick });
}

function handleTapKeyPick(
  input: Omit<TapDancePickInput, 'item'> & { readonly pick: PickerPick },
): boolean {
  const { picker, target, selectionName, commit, pick } = input;
  const shared = picker.shared;
  const tapIndex = picker.editingTap;
  if (
    pick.kind !== 'keycode' ||
    shared.kind !== 'same' ||
    shared.binding.kind !== 'tap_dance' ||
    tapIndex === undefined
  ) {
    return false;
  }
  const taps = shared.binding.taps.map((tap, index) =>
    index === tapIndex ? { keycode: pick.keycode, modifiers: [...picker.pendingModifiers] } : tap,
  );
  commit(
    (current) => setTapDanceTaps(current, { ...target, taps }),
    `${selectionName}: tap ${tapIndex + 1}`,
  );
  picker.setPendingModifiers([]);
  picker.setEditingTap(undefined);
  picker.setEditingMorphSide(undefined);
  input.onPicked();
  return true;
}

type TapDanceControlsInput = {
  readonly picker: KeyPickerState;
  readonly target: TapDanceTarget;
  readonly selectionName: string;
  readonly commit: TapDanceCommit;
  readonly binding: Extract<Binding, { kind: 'tap_dance' }>;
};

// Parameter controls for the shared tap-dance; nothing when the selection shares another action.
export function toTapDanceControls(
  input: Omit<TapDanceControlsInput, 'binding'>,
): TapDanceControls | undefined {
  const shared = input.picker.shared;
  if (shared.kind !== 'same' || shared.binding.kind !== 'tap_dance') {
    return undefined;
  }
  return {
    binding: shared.binding,
    editingTap: input.picker.editingTap,
    ...toTapListHandlers({ ...input, binding: shared.binding }),
  };
}

function toTapListHandlers(
  input: TapDanceControlsInput,
): Omit<TapDanceControls, 'binding' | 'editingTap'> {
  const { target, selectionName, commit, binding } = input;
  return {
    handleArmTap: (index) => {
      input.picker.setEditingTap(index);
    },
    handleTapModifiersChange: (index, modifiers) => {
      const taps = binding.taps.map((tap, tapIndex) =>
        tapIndex === index ? { ...tap, modifiers: [...modifiers] } : tap,
      );
      commit(
        (current) => setTapDanceTaps(current, { ...target, taps }),
        `${selectionName}: tap ${index + 1} modifiers`,
      );
    },
    handleAddTap: () => {
      commit(
        (current) => setTapDanceTaps(current, { ...target, taps: [...binding.taps, PLAIN_A] }),
        `${selectionName}: tap added`,
      );
    },
    ...toTapFooterHandlers(input),
  };
}

function toTapFooterHandlers(
  input: TapDanceControlsInput,
): Pick<TapDanceControls, 'handleRemoveTap' | 'handlePauseChange'> {
  const { target, selectionName, commit, binding } = input;
  return {
    handleRemoveTap: (index) => {
      if (binding.taps.length === 1) {
        commit(
          (current) => setBindings(current, { ...target, binding: { kind: 'kp', key: PLAIN_A } }),
          `${selectionName}: tap dance removed`,
        );
        return;
      }
      const taps = binding.taps.filter((_, tapIndex) => tapIndex !== index);
      commit(
        (current) => setTapDanceTaps(current, { ...target, taps }),
        `${selectionName}: tap removed`,
      );
    },
    handlePauseChange: (tappingTermMs) => {
      commit(
        (current) => setTappingTerm(current, { ...target, tappingTermMs }),
        `${selectionName}: pause`,
      );
    },
  };
}
