import { BINDING_POLICY } from './binding-policy';
import { mapLayerBindings } from './map-layer-bindings';
import type { Binding, KeyStroke, Project } from './types';

const PLAIN_A: KeyStroke = { keycode: 'A', modifiers: [] };

/** What the pickers offer: a single plain tap with the editor default pause. */
export const TAP_DANCE_STARTER = {
  kind: 'tap_dance',
  taps: [PLAIN_A],
  tappingTermMs: BINDING_POLICY.defaultPauseMs,
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

// The tap-dance starter: one tap from the key each selected key sends, else a plain A,
// with the editor default pause (spec 005 data-model.md).
export function setTapDanceBinding(
  project: Project,
  input: {
    readonly layerIndex: number;
    readonly keyIds: readonly string[];
  },
): Project {
  return mapLayerBindings(project, input, (binding) => ({
    ...TAP_DANCE_STARTER,
    taps: [findTapStroke(binding)],
  }));
}
