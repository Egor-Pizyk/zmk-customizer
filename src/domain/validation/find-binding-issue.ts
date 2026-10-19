import { BINDING_POLICY, isValidTappingTerm, getBindingStrokes } from '@domain/bindings';
import type { Binding, KeyStroke, ValidationIssue } from '@domain';
import type { BindingsCatalog } from './validate-bindings';

export type BindingIssueInput = {
  readonly binding: Binding;
  readonly keyLabel: string;
  readonly catalog: Pick<BindingsCatalog, 'keycodeNames' | 'bluetoothProfileCount'>;
  /** Ids of the project's layers; a layer behavior may name a deleted one (spec 007 R1). */
  readonly layerIds: ReadonlySet<string>;
};

// Keys a binding sends must exist in ZMK v0.3, layers it switches to in the project.
function findReferenceIssue(
  input: BindingIssueInput,
): Pick<ValidationIssue, 'code' | 'message'> | undefined {
  const { binding, keyLabel, catalog } = input;
  const unknown = getBindingStrokes(binding).find(
    (stroke) => !catalog.keycodeNames.has(stroke.keycode),
  );
  if (unknown !== undefined) {
    return {
      code: 'binding-keycode-unknown',
      message: `${keyLabel} sends ${unknown.keycode}, which ZMK v0.3 does not know. Pick another key in Bindings.`,
    };
  }
  if ('layerId' in binding && !input.layerIds.has(binding.layerId)) {
    return {
      code: 'binding-layer-missing',
      message: `${keyLabel} uses a deleted layer. Pick another layer in Bindings.`,
    };
  }
  return undefined;
}

export function findBindingIssue(
  input: BindingIssueInput,
): Pick<ValidationIssue, 'code' | 'message'> | undefined {
  const { binding, keyLabel, catalog } = input;
  const referenceIssue = findReferenceIssue(input);
  if (referenceIssue !== undefined) {
    return referenceIssue;
  }
  if (
    binding.kind === 'bt' &&
    'profile' in binding &&
    (binding.profile < 0 || binding.profile >= catalog.bluetoothProfileCount)
  ) {
    const lastProfile = catalog.bluetoothProfileCount - 1;
    return {
      code: 'binding-profile-out-of-range',
      message: `${keyLabel} uses Bluetooth profile ${binding.profile}; only profiles 0–${lastProfile} exist. Pick another profile in Bindings.`,
    };
  }
  if (binding.kind === 'tap_dance' && !isValidTappingTerm(binding.tappingTermMs)) {
    return {
      code: 'binding-tapping-term-out-of-range',
      message: `${keyLabel} waits ${binding.tappingTermMs} ms to count taps; use a pause of ${BINDING_POLICY.minPauseMs}–${BINDING_POLICY.maxPauseMs} ms. Change the pause in Bindings.`,
    };
  }
  if (binding.kind === 'mod_morph' && isSameStroke(binding.normal, binding.morphed)) {
    return {
      code: 'binding-mod-morph-same-action',
      message: `${keyLabel} morphs ${binding.normal.keycode} into itself; pick different actions in Bindings.`,
    };
  }
  return undefined;
}

// Strokes from the editor and the schema keep modifiers unique and ordered (project-schema.ts).
function isSameStroke(first: KeyStroke, second: KeyStroke): boolean {
  return (
    first.keycode === second.keycode &&
    first.modifiers.length === second.modifiers.length &&
    first.modifiers.every((modifier, index) => modifier === second.modifiers[index])
  );
}
