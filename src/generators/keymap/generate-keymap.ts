import { renderEncoderBehaviors } from './render-encoder-behaviors';
import { renderEncoderBindings } from './render-encoder-bindings';
import { renderAdvancedKeymap } from './render-advanced-keymap';
import { getProjectBindings } from '@domain/behaviors';
import { getShieldName } from '@domain/project';
import { toLayerNodeName } from '@domain/layers';
import type { Layer, Project } from '@domain';
import { escapeString } from '@generators';
import type { GeneratedFile } from '@generators';
import { renderBinding } from './render-binding';
import { renderCustomBehaviors } from './render-custom-behaviors';

function renderIncludes(project: Project): string {
  const bindings = getProjectBindings(project);
  const headers = ['behaviors.dtsi', 'dt-bindings/zmk/keys.h'];
  if (bindings.some((binding) => binding.kind === 'bt')) {
    headers.push('dt-bindings/zmk/bt.h');
  }
  if (bindings.some((binding) => binding.kind === 'out')) {
    headers.push('dt-bindings/zmk/outputs.h');
  }
  return headers.map((header) => `#include <${header}>`).join('\n');
}

function renderLayer(
  layer: Layer,
  input: {
    readonly project: Project;
    readonly custom: ReturnType<typeof renderCustomBehaviors>;
    readonly encoderLabels: readonly string[];
  },
): string {
  const bindings = input.project.keys
    .map(
      (key) =>
        `                ${renderBinding(layer.bindings[key.id] ?? { kind: 'none' }, { project: input.project, findCustomLabel: input.custom.findLabel })}`,
    )
    .join('\n');
  return `        ${toLayerNodeName(layer.name)} {
            display-name = "${escapeString(layer.name, 'devicetree')}";
            bindings = <
${bindings}
            >;${renderEncoderBindings(input.encoderLabels)}
        };`;
}

export function generateKeymap(project: Project): GeneratedFile {
  const shieldName = getShieldName(project);
  const custom = renderCustomBehaviors(project);
  const encoders = renderEncoderBehaviors(project, custom.findLabel);
  const layers = project.layers
    .map((layer, index) =>
      renderLayer(layer, { project, custom, encoderLabels: encoders.labels[index] ?? [] }),
    )
    .join('\n\n');
  return {
    path: `boards/shields/${shieldName}/${shieldName}.keymap`,
    content: `${renderIncludes(project)}

/ {
${custom.text}${encoders.text}${renderAdvancedKeymap(project, custom.findLabel)}    keymap {
        compatible = "zmk,keymap";

${layers}
    };
};
`,
  };
}
