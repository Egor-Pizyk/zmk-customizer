import { assertNever } from './assert-never';
import type { Binding, KeyStroke, Layer, Project, ValidationIssue } from './types';

/** ZMK facts from src/catalog/, passed in so domain imports nothing (AGENTS §3.1, spec 004 R8). */
export type BindingsCatalog = {
  readonly keycodeNames: ReadonlySet<string>;
  readonly bluetoothProfileCount: number;
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
    case 'tap_dance': {
      return binding.taps;
    }
    // mod_morph joins its story with a real branch (spec 005 Phase 5).
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'bt':
    case 'out':
    case 'sys_reset':
    case 'bootloader':
    case 'mod_morph': {
      return [];
    }
    default: {
      return assertNever(binding);
    }
  }
}

function findBindingIssue(input: {
  readonly binding: Binding;
  readonly keyLabel: string;
  readonly catalog: BindingsCatalog;
}): Pick<ValidationIssue, 'code' | 'message'> | undefined {
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
  if (binding.kind === 'tap_dance' && (binding.tappingTermMs < 0 || binding.tappingTermMs > 5000)) {
    return {
      code: 'binding-tapping-term-out-of-range',
      message: `${keyLabel} waits ${binding.tappingTermMs} ms to count taps; use a pause of 0–5000 ms. Change the pause in Bindings.`,
    };
  }
  return undefined;
}

function validateLayer(
  project: Project,
  input: { readonly layer: Layer; readonly layerIndex: number; readonly catalog: BindingsCatalog },
): readonly ValidationIssue[] {
  const { layer, layerIndex, catalog } = input;
  return project.keys.flatMap((key, keyIndex) => {
    const binding = layer.bindings[key.id];
    const keyLabel = `Key ${keyIndex} on layer ${layer.name}`;
    const issue =
      binding === undefined ? undefined : findBindingIssue({ binding, keyLabel, catalog });
    return issue === undefined
      ? []
      : [{ ...issue, path: ['layers', layerIndex, 'bindings', key.id] }];
  });
}

// Key names and profiles are checked here, not by the schema, so old files still open (R7).
export function validateBindings(
  project: Project,
  catalog: BindingsCatalog,
): readonly ValidationIssue[] {
  return project.layers.flatMap((layer, layerIndex) =>
    validateLayer(project, { layer, layerIndex, catalog }),
  );
}
