import { BINDING_POLICY, isValidTappingTerm } from '@domain/bindings';
import { assertNever } from '@domain';
import type { Binding, KeyStroke, Layer, Project, ValidationIssue } from '@domain';

/** ZMK facts from src/catalog/, passed in so domain imports nothing (AGENTS §3.1, spec 004 R8). */
export type BindingsCatalog = {
  readonly keycodeNames: ReadonlySet<string>;
  readonly bluetoothProfileCount: number;
  readonly maxLayerCount: number;
  readonly shieldLimits: {
    readonly keyboardNameBytes: number;
    readonly layerNodeNameLength: number;
    readonly layerDisplayNameBytes: number;
    readonly minLayoutCell: number;
    readonly maxLayoutCell: number;
  };
};

function getKeyStrokes(binding: Binding): readonly KeyStroke[] {
  switch (binding.kind) {
    case 'kp':
    case 'sk':
    case 'kt': {
      return [binding.key];
    }
    case 'mt': {
      return [binding.hold, binding.tap];
    }
    case 'lt': {
      return [binding.tap];
    }
    case 'tap_dance': {
      return binding.taps;
    }
    case 'mod_morph': {
      return [binding.normal, binding.morphed];
    }
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'bt':
    case 'out':
    case 'sys_reset':
    case 'bootloader':
    case 'mo':
    case 'tog':
    case 'to':
    case 'sl': {
      return [];
    }
    default: {
      return assertNever(binding);
    }
  }
}

type BindingIssueInput = {
  readonly binding: Binding;
  readonly keyLabel: string;
  readonly catalog: BindingsCatalog;
  /** Ids of the project's layers; a layer behavior may name a deleted one (spec 007 R1). */
  readonly layerIds: ReadonlySet<string>;
};

// Keys a binding sends must exist in ZMK v0.3, layers it switches to in the project.
function findReferenceIssue(
  input: BindingIssueInput,
): Pick<ValidationIssue, 'code' | 'message'> | undefined {
  const { binding, keyLabel, catalog } = input;
  const unknown = getKeyStrokes(binding).find(
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

function findBindingIssue(
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

function validateLayer(
  project: Project,
  input: Pick<BindingIssueInput, 'catalog' | 'layerIds'> & {
    readonly layer: Layer;
    readonly layerIndex: number;
  },
): readonly ValidationIssue[] {
  const { layer, layerIndex, catalog, layerIds } = input;
  return project.keys.flatMap((key, keyIndex) => {
    const binding = layer.bindings[key.id];
    const keyLabel = `Key ${keyIndex} on layer ${layer.name}`;
    const issue =
      binding === undefined
        ? undefined
        : findBindingIssue({ binding, keyLabel, catalog, layerIds });
    return issue === undefined
      ? []
      : [{ ...issue, path: ['layers', layerIndex, 'bindings', key.id] }];
  });
}

// Key names, profiles and layer targets are checked here, not by the schema, so old files still
// open (R7) and a deleted layer's references stay until the user repicks them (spec 007 R2).
export function validateBindings(
  project: Project,
  catalog: BindingsCatalog,
): readonly ValidationIssue[] {
  const layerIds = new Set(project.layers.map((layer) => layer.id));
  return project.layers.flatMap((layer, layerIndex) =>
    validateLayer(project, { layer, layerIndex, catalog, layerIds }),
  );
}
