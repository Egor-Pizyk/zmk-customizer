import { mapLayerBindings } from '@domain/layers';
import { normalizeModifiers } from '@domain/bindings';
import type { Binding, Modifier, Project } from '@domain';

function withKeycode(
  binding: Binding | undefined,
  input: { readonly keycode: string; readonly modifiers: readonly Modifier[] },
): Binding {
  const { keycode } = input;
  if (binding?.kind === 'kp' || binding?.kind === 'sk' || binding?.kind === 'kt') {
    return { ...binding, key: { ...binding.key, keycode } };
  }
  if (binding?.kind === 'mt' || binding?.kind === 'lt') {
    return { ...binding, tap: { ...binding.tap, keycode } };
  }
  return { kind: 'kp', key: { keycode, modifiers: normalizeModifiers(input.modifiers) } };
}

// Picking a key in the key picker keeps each key's mode, hold, layer and modifiers; other actions
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
