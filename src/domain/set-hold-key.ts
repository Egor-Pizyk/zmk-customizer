import { mapLayerBindings } from './map-layer-bindings';
import type { Binding, KeyStroke, Project } from './types';

function withHold(binding: Binding | undefined, hold: KeyStroke | undefined): Binding | undefined {
  if (binding?.kind === 'kp') {
    return hold === undefined ? undefined : { kind: 'mt', hold, tap: binding.key };
  }
  if (binding?.kind === 'mt') {
    return hold === undefined ? { kind: 'kp', key: binding.tap } : { ...binding, hold };
  }
  return undefined;
}

// "When held" of the key picker: a hold key turns a key press into mod-tap, none turns it back
// (spec 004 FR-012). Other kinds are left alone.
export function setHoldKey(
  project: Project,
  input: {
    readonly layerIndex: number;
    readonly keyIds: readonly string[];
    readonly hold?: KeyStroke;
  },
): Project {
  return mapLayerBindings(project, input, (binding) => withHold(binding, input.hold));
}
