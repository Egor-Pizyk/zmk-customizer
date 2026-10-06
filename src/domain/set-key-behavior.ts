import { mapLayerBindings } from './map-layer-bindings';
import type { Binding, KeyStroke, Project } from './types';

/** The behaviors that send one key; mod-tap needs the hold for keys that have none yet. */
export type KeyBehavior =
  | { readonly id: 'kp' | 'sk' | 'kt' }
  | { readonly id: 'mt'; readonly hold: KeyStroke };

function findSentStroke(binding: Binding | undefined): KeyStroke | undefined {
  if (binding?.kind === 'kp' || binding?.kind === 'sk' || binding?.kind === 'kt') {
    return binding.key;
  }
  return binding?.kind === 'mt' ? binding.tap : undefined;
}

function withBehavior(binding: Binding | undefined, behavior: KeyBehavior): Binding | undefined {
  const key = findSentStroke(binding);
  if (key === undefined) {
    return undefined;
  }
  if (behavior.id === 'mt') {
    return { kind: 'mt', hold: binding?.kind === 'mt' ? binding.hold : behavior.hold, tap: key };
  }
  return { kind: behavior.id, key };
}

// Switching among &kp, &sk, &kt and &mt keeps each key's key; other kinds stay (spec 006 FR-008).
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
