import { mapLayerBindings } from './map-layer-bindings';
import { MODIFIERS } from './types';
import type { Binding, Modifier, Project } from './types';

function normalizeModifiers(modifiers: readonly Modifier[]): readonly Modifier[] {
  return MODIFIERS.filter((modifier) => modifiers.includes(modifier));
}

function withKeycode(
  binding: Binding | undefined,
  input: { readonly keycode: string; readonly modifiers: readonly Modifier[] },
): Binding {
  const { keycode } = input;
  if (binding?.kind === 'kp' || binding?.kind === 'sk' || binding?.kind === 'kt') {
    return { ...binding, key: { ...binding.key, keycode } };
  }
  if (binding?.kind === 'mt') {
    return { ...binding, tap: { ...binding.tap, keycode } };
  }
  return { kind: 'kp', key: { keycode, modifiers: normalizeModifiers(input.modifiers) } };
}

// Picking a key in the key picker keeps each key's mode, hold and modifiers; other actions
// become a key press with the given modifiers (spec 004 research R14).
export function setKeycode(
  project: Project,
  input: {
    readonly layerIndex: number;
    readonly keyIds: readonly string[];
    readonly keycode: string;
    readonly modifiers: readonly Modifier[];
  },
): Project {
  return mapLayerBindings(project, input, (binding) => withKeycode(binding, input));
}
