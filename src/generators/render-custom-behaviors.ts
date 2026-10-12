import { MODIFIER_BITS } from '../catalog/modifier-bits';
import { assertNever } from '../domain/assert-never';
import type { Binding, Project } from '../domain/types';
import { renderKeyStroke } from './render-key-stroke';

type CustomBinding = Extract<Binding, { readonly kind: 'tap_dance' | 'mod_morph' }>;
export type CustomBehavior = { readonly label: string; readonly definition: string };
export type RenderedCustomBehaviors = {
  readonly text: string;
  readonly bySignature: ReadonlyMap<string, CustomBehavior>;
};

function renderDefinition(binding: CustomBinding): string {
  switch (binding.kind) {
    case 'tap_dance': {
      return `            compatible = "zmk,behavior-tap-dance";
            #binding-cells = <0>;
            tapping-term-ms = <${binding.tappingTermMs}>;
            bindings = ${binding.taps.map((tap) => `<&kp ${renderKeyStroke(tap)}>`).join(', ')};`;
    }
    case 'mod_morph': {
      return `            compatible = "zmk,behavior-mod-morph";
            #binding-cells = <0>;
            bindings = <&kp ${renderKeyStroke(binding.normal)}>, <&kp ${renderKeyStroke(binding.morphed)}>;
            mods = <(${binding.mods.map((modifier) => MODIFIER_BITS[modifier]).join(' | ')})>;`;
    }
    default: {
      return assertNever(binding);
    }
  }
}

export function renderCustomBehaviors(
  project: Project,
): RenderedCustomBehaviors & { readonly findLabel: (binding: CustomBinding) => string } {
  const bySignature = new Map<string, CustomBehavior>();
  const definitions: string[] = [];
  for (const layer of project.layers) {
    for (const key of project.keys) {
      const binding = layer.bindings[key.id];
      if (binding?.kind !== 'tap_dance' && binding?.kind !== 'mod_morph') {
        continue;
      }
      const definition = renderDefinition(binding);
      if (bySignature.has(definition)) {
        continue;
      }
      const prefix = binding.kind === 'tap_dance' ? 'custom_td' : 'custom_mm';
      const label = `${prefix}_${bySignature.size}`;
      bySignature.set(definition, { label, definition });
      definitions.push(`        ${label}: ${label} {\n${definition}\n        };`);
    }
  }
  return {
    bySignature,
    text: definitions.length === 0 ? '' : `    behaviors {\n${definitions.join('\n')}\n    };\n\n`,
    findLabel: (binding) => {
      const behavior = bySignature.get(renderDefinition(binding));
      if (behavior === undefined) {
        throw new Error('Custom behavior was not collected');
      }
      return behavior.label;
    },
  };
}
