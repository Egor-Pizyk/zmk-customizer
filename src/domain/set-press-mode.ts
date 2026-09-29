import { mapLayerBindings } from './map-layer-bindings';
import type { Binding, KeyStroke, Project } from './types';

export type PressMode = 'normal' | 'sticky' | 'toggle';

function findKeyStroke(binding: Binding | undefined): KeyStroke | undefined {
  if (binding?.kind === 'kp' || binding?.kind === 'sk' || binding?.kind === 'kt') {
    return binding.key;
  }
  return binding?.kind === 'mt' ? binding.tap : undefined;
}

function withMode(binding: Binding | undefined, mode: PressMode): Binding | undefined {
  const key = findKeyStroke(binding);
  if (key === undefined) {
    return undefined;
  }
  if (mode === 'sticky') {
    return { kind: 'sk', key };
  }
  if (mode === 'toggle') {
    return { kind: 'kt', key };
  }
  // Mod-tap already presses normally when tapped.
  return binding?.kind === 'mt' ? binding : { kind: 'kp', key };
}

// Press mode of the key picker: normal (&kp), sticky (&sk) or toggle (&kt), keeping the key
// (spec 004 FR-012).
export function setPressMode(
  project: Project,
  input: {
    readonly layerIndex: number;
    readonly keyIds: readonly string[];
    readonly mode: PressMode;
  },
): Project {
  return mapLayerBindings(project, input, (binding) => withMode(binding, input.mode));
}
