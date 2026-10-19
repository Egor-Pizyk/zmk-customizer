import type { Binding, Project } from '@domain';
import { renderBinding } from './render-binding';

type CustomBinding = Extract<Binding, { readonly kind: 'tap_dance' | 'mod_morph' }>;
export type RenderedEncoderBehaviors = {
  readonly text: string;
  readonly labels: readonly (readonly string[])[];
};
export function renderEncoderBehaviors(
  project: Project,
  findCustomLabel: (binding: CustomBinding) => string,
): RenderedEncoderBehaviors {
  const definitions: string[] = [];
  const bySignature = new Map<string, string>();
  const labels = project.layers.map((layer, layerIndex) =>
    project.encoders.map((encoder, index) => {
      const binding = layer.encoderBindings?.[encoder.id];
      const clockwise = renderBinding(binding?.clockwise ?? { kind: 'none' }, {
        project,
        findCustomLabel,
      });
      const counterclockwise = renderBinding(binding?.counterclockwise ?? { kind: 'none' }, {
        project,
        findCustomLabel,
      });
      const signature = `${clockwise}\n${counterclockwise}`;
      const existing = bySignature.get(signature);
      if (existing !== undefined) {
        return existing;
      }
      const label = `encoder_rotation_${layerIndex}_${index}`;
      bySignature.set(signature, label);
      definitions.push(renderDefinition({ label, clockwise, counterclockwise }));
      return label;
    }),
  );
  return {
    labels,
    text: definitions.length === 0 ? '' : `    behaviors {\n${definitions.join('\n')}\n    };\n\n`,
  };
}
function renderDefinition(input: {
  readonly label: string;
  readonly clockwise: string;
  readonly counterclockwise: string;
}): string {
  return `        ${input.label}: ${input.label} {
            compatible = "zmk,behavior-sensor-rotate";
            #sensor-binding-cells = <0>;
            bindings = <${input.clockwise}>, <${input.counterclockwise}>;
        };`;
}
