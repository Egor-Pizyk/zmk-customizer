import {
  setKeyPressModifier,
  setBindings,
  setModMorphKeys,
  setModMorphMods,
  setTapDanceTaps,
  setTappingTerm,
} from '@domain/bindings/editing';
import { MODIFIERS } from '@domain';
import type { KeyStroke, Modifier, Project } from '@domain';
import { findModifierTarget } from './binding-slots';
import type { KeyPickerState } from './use-key-picker';

type OptionHandlerOptions = {
  readonly selectionName: string;
  readonly picker: KeyPickerState;
  readonly commit: (change: (project: Project) => Project, announcementText?: string) => void;
  readonly target: { readonly layerIndex: number; readonly keyIds: readonly string[] };
};

const PLAIN_A: KeyStroke = { keycode: 'A', modifiers: [] };

function toggleModifier(
  modifiers: readonly Modifier[],
  input: { readonly modifier: Modifier; readonly isEnabled: boolean },
): readonly Modifier[] {
  return MODIFIERS.filter((candidate) =>
    candidate === input.modifier ? input.isEnabled : modifiers.includes(candidate),
  );
}

// Chips of the open slot (spec 006 FR-010): a drafted key holds them for the key picked next;
// a stored key, tap or side changes at once for every selected key (one undo step).
function handleModifierToggle(
  options: OptionHandlerOptions,
  input: { readonly modifier: Modifier; readonly isEnabled: boolean },
) {
  const { picker, target, commit, selectionName } = options;
  const { source, slot } = picker;
  const stroke = findModifierTarget(source, slot);
  if (stroke === 'pending') {
    picker.setPendingModifiers(toggleModifier(picker.pendingModifiers, input));
    return;
  }
  if (stroke === undefined || source.kind !== 'binding') {
    return;
  }
  const changed = { ...stroke, modifiers: toggleModifier(stroke.modifiers, input) };
  const { binding } = source;
  const text = `${selectionName}: modifiers changed`;
  if (slot.kind === 'custom-parameter' && binding.kind === 'custom') {
    const parameters = binding.parameters.map((parameter, index) =>
      parameter.kind === 'key' && index === slot.index ? { ...parameter, key: changed } : parameter,
    );
    commit(
      (current) => setBindings(current, { ...target, binding: { ...binding, parameters } }),
      text,
    );
    return;
  }
  if (slot.kind === 'dance-tap' && binding.kind === 'tap_dance') {
    const taps = binding.taps.map((tap, index) => (index === slot.index ? changed : tap));
    commit((current) => setTapDanceTaps(current, { ...target, taps }), text);
  } else if (slot.kind === 'morph-side' && binding.kind === 'mod_morph') {
    const keys = { normal: binding.normal, morphed: binding.morphed, [slot.side]: changed };
    commit((current) => setModMorphKeys(current, { ...target, ...keys }), text);
  } else {
    commit((current) => setKeyPressModifier(current, { ...target, ...input }), text);
  }
}

function findTapDance(picker: KeyPickerState) {
  const { source } = picker;
  return source.kind === 'binding' && source.binding.kind === 'tap_dance'
    ? source.binding
    : undefined;
}

// Add and remove taps and the pause (spec 005 FR-007–FR-008).
function toTapDanceHandlers(options: OptionHandlerOptions) {
  const { picker, target, commit, selectionName } = options;
  return {
    handleAddTap: () => {
      const taps = [...(findTapDance(picker)?.taps ?? []), PLAIN_A];
      commit(
        (current) => setTapDanceTaps(current, { ...target, taps }),
        `${selectionName}: tap added`,
      );
      picker.handleSlotOpen({ kind: 'dance-tap', index: taps.length - 1 });
    },
    handleRemoveTap: (index: number) => {
      const taps = findTapDance(picker)?.taps.filter((_, tapIndex) => tapIndex !== index) ?? [];
      if (taps.length === 0) {
        return;
      }
      commit(
        (current) => setTapDanceTaps(current, { ...target, taps }),
        `${selectionName}: tap removed`,
      );
      picker.handleSlotOpen({ kind: 'dance-tap', index: Math.max(index - 1, 0) });
    },
    handlePauseChange: (tappingTermMs: number) => {
      commit(
        (current) => setTappingTerm(current, { ...target, tappingTermMs }),
        `${selectionName}: pause`,
      );
    },
  };
}

// Chips of the open slot, tap-dance taps and pause, mod-morph triggers (spec 006 FR-010).
export function createOptionHandlers(options: OptionHandlerOptions) {
  const { picker, target, commit, selectionName } = options;
  return {
    ...toTapDanceHandlers(options),
    handleModifierToggle: (modifier: Modifier, isEnabled: boolean) => {
      handleModifierToggle(options, { modifier, isEnabled });
    },
    handleTriggerToggle: (modifier: Modifier, isEnabled: boolean) => {
      const { source } = picker;
      if (source.kind !== 'binding' || source.binding.kind !== 'mod_morph') {
        return;
      }
      const mods = toggleModifier(source.binding.mods, { modifier, isEnabled });
      commit(
        (current) => setModMorphMods(current, { ...target, mods }),
        `${selectionName}: triggers`,
      );
    },
  };
}
