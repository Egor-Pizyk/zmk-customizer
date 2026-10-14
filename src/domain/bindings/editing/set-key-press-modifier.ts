import { mapLayerBindings } from '@domain/layers';
import { MODIFIERS } from '@domain';
import type { Binding, KeyStroke, Modifier, Project } from '@domain';

function toggle(
  stroke: KeyStroke,
  input: { readonly modifier: Modifier; readonly isEnabled: boolean },
) {
  const modifiers = MODIFIERS.filter((modifier) =>
    modifier === input.modifier ? input.isEnabled : stroke.modifiers.includes(modifier),
  );
  return { ...stroke, modifiers };
}

function withModifier(
  binding: Binding | undefined,
  input: { readonly modifier: Modifier; readonly isEnabled: boolean },
): Binding | undefined {
  if (binding?.kind === 'kp') {
    return { ...binding, key: toggle(binding.key, input) };
  }
  return binding?.kind === 'mt' || binding?.kind === 'lt'
    ? { ...binding, tap: toggle(binding.tap, input) }
    : undefined;
}

// Modifier chips act on key presses and the tap of mod-tap and layer-tap; others stay (FR-011).
export function setKeyPressModifier(
  project: Project,
  input: {
    readonly layerIndex: number;
    readonly keyIds: readonly string[];
    readonly modifier: Modifier;
    readonly isEnabled: boolean;
  },
): Project {
  return mapLayerBindings(project, input, (binding) => withModifier(binding, input));
}
