import { mapLayerBindings } from '@domain/layers';
import type { Binding, KeyStroke, Project } from '@domain';

const PLAIN_A: KeyStroke = { keycode: 'A', modifiers: [] };

/** What the pickers offer: plain actions morphed by left shift (spec 005 data-model.md). */
export const MOD_MORPH_STARTER = {
  kind: 'mod_morph',
  normal: PLAIN_A,
  morphed: PLAIN_A,
  mods: ['LS'],
} satisfies Binding;

function findTapStroke(binding: Binding | undefined): KeyStroke {
  if (binding?.kind === 'kp' || binding?.kind === 'sk' || binding?.kind === 'kt') {
    return binding.key;
  }
  if (binding?.kind === 'mt') {
    return binding.tap;
  }
  return PLAIN_A;
}

// The mod-morph starter: normal and morphed from the key each selected key sends, else plain
// actions, triggered by left shift (spec 005 data-model.md).
export function setModMorphBinding(
  project: Project,
  input: {
    readonly layerIndex: number;
    readonly keyIds: readonly string[];
  },
): Project {
  return mapLayerBindings(project, input, (binding) => ({
    ...MOD_MORPH_STARTER,
    normal: findTapStroke(binding),
    morphed: findTapStroke(binding),
  }));
}
