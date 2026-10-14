import { mapLayerBindings } from '@domain/layers';
import type { Binding, KeyStroke, Project } from '@domain';

/** The behaviors that send one key; mod-tap needs the hold, layer-tap the layer (spec 007). */
export type KeyBehavior =
  | { readonly id: 'kp' | 'sk' | 'kt' }
  | { readonly id: 'mt'; readonly hold: KeyStroke }
  | { readonly id: 'lt'; readonly layerId: string };

function findSentStroke(binding: Binding | undefined): KeyStroke | undefined {
  if (binding?.kind === 'kp' || binding?.kind === 'sk' || binding?.kind === 'kt') {
    return binding.key;
  }
  return binding?.kind === 'mt' || binding?.kind === 'lt' ? binding.tap : undefined;
}

function withBehavior(binding: Binding | undefined, behavior: KeyBehavior): Binding | undefined {
  const key = findSentStroke(binding);
  if (key === undefined) {
    return undefined;
  }
  if (behavior.id === 'mt') {
    return { kind: 'mt', hold: binding?.kind === 'mt' ? binding.hold : behavior.hold, tap: key };
  }
  if (behavior.id === 'lt') {
    return { kind: 'lt', layerId: behavior.layerId, tap: key };
  }
  return { kind: behavior.id, key };
}

// Switching among &kp, &sk, &kt, &mt and &lt keeps each key's key; other kinds stay (spec 006
// FR-008, spec 007).
export function setKeyBehavior(
  project: Project,
  input: {
    readonly layerIndex: number;
    readonly keyIds: readonly string[];
    readonly behavior: KeyBehavior;
  },
): Project {
  return mapLayerBindings(project, input, (binding) => withBehavior(binding, input.behavior));
}
