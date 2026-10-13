import { mapLayerBindings } from '../layers/map-layer-bindings';
import { normalizeModifiers } from './normalize-modifiers';
import type { Binding, KeyStroke, Project } from '../types';

function withTaps(binding: Binding | undefined, taps: readonly KeyStroke[]): Binding | undefined {
  if (binding?.kind !== 'tap_dance' || taps.length === 0) {
    return undefined;
  }
  return {
    ...binding,
    taps: taps.map((tap) => ({ ...tap, modifiers: normalizeModifiers(tap.modifiers) })),
  };
}

// Replaces the tap list of tap-dance keys; other kinds stay. An empty list changes nothing:
// removing the last tap resets through setBindings (spec 005 data-model.md).
export function setTapDanceTaps(
  project: Project,
  input: {
    readonly layerIndex: number;
    readonly keyIds: readonly string[];
    readonly taps: readonly KeyStroke[];
  },
): Project {
  return mapLayerBindings(project, input, (binding) => withTaps(binding, input.taps));
}
