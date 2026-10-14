import { mapLayerBindings } from '@domain/layers';
import { normalizeModifiers } from '@domain/bindings';
import type { Binding, Modifier, Project } from '@domain';

function withMods(binding: Binding | undefined, mods: readonly Modifier[]): Binding | undefined {
  if (binding?.kind !== 'mod_morph' || mods.length === 0) {
    return undefined;
  }
  return { ...binding, mods: normalizeModifiers(mods) };
}

// Replaces the trigger set of mod-morph keys; other kinds stay. An empty set changes nothing:
// the editor never writes it (spec 005 data-model.md).
export function setModMorphMods(
  project: Project,
  input: {
    readonly layerIndex: number;
    readonly keyIds: readonly string[];
    readonly mods: readonly Modifier[];
  },
): Project {
  return mapLayerBindings(project, input, (binding) => withMods(binding, input.mods));
}
