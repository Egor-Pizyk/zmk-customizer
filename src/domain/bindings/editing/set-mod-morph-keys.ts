import { mapLayerBindings } from '@domain/layers';
import { normalizeModifiers } from '@domain/bindings';
import type { Binding, KeyStroke, Project } from '@domain';

function withKeys(
  binding: Binding | undefined,
  input: { readonly normal: KeyStroke; readonly morphed: KeyStroke },
): Binding | undefined {
  if (binding?.kind !== 'mod_morph') {
    return undefined;
  }
  return {
    ...binding,
    normal: { ...input.normal, modifiers: normalizeModifiers(input.normal.modifiers) },
    morphed: { ...input.morphed, modifiers: normalizeModifiers(input.morphed.modifiers) },
  };
}

// Replaces the normal and morphed actions of mod-morph keys; other kinds stay.
export function setModMorphKeys(
  project: Project,
  input: {
    readonly layerIndex: number;
    readonly keyIds: readonly string[];
    readonly normal: KeyStroke;
    readonly morphed: KeyStroke;
  },
): Project {
  return mapLayerBindings(project, input, (binding) => withKeys(binding, input));
}
