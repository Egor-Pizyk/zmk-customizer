import { mapLayerBindings } from '../layers/map-layer-bindings';
import type { Binding, Project } from '../types';

function withTappingTerm(binding: Binding | undefined, tappingTermMs: number): Binding | undefined {
  return binding?.kind === 'tap_dance' ? { ...binding, tappingTermMs } : undefined;
}

// Edits the resolving pause of tap-dance keys; other kinds stay. Stored as given, even out
// of range — validation reports it (spec 005 FR-013).
export function setTappingTerm(
  project: Project,
  input: {
    readonly layerIndex: number;
    readonly keyIds: readonly string[];
    readonly tappingTermMs: number;
  },
): Project {
  return mapLayerBindings(project, input, (binding) =>
    withTappingTerm(binding, input.tappingTermMs),
  );
}
