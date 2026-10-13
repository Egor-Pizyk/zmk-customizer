import { getShieldName, toLayerNodeName } from '@domain';
import type { Layer, Project } from '@domain';
import { escapeString } from '../escape-string';
import type { GeneratedFile } from '../generated-file';
import { renderBinding } from './render-binding';
import { renderCustomBehaviors } from './render-custom-behaviors';

function renderIncludes(project: Project): string {
  const bindings = project.layers.flatMap((layer) =>
    project.keys.map((key) => layer.bindings[key.id]),
  );
  const headers = ['behaviors.dtsi', 'dt-bindings/zmk/keys.h'];
  if (bindings.some((binding) => binding?.kind === 'bt')) {
    headers.push('dt-bindings/zmk/bt.h');
  }
  if (bindings.some((binding) => binding?.kind === 'out')) {
    headers.push('dt-bindings/zmk/outputs.h');
  }
  return headers.map((header) => `#include <${header}>`).join('\n');
}

function renderLayer(
  layer: Layer,
  input: { readonly project: Project; readonly custom: ReturnType<typeof renderCustomBehaviors> },
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
            >;
        };`;
}

export function generateKeymap(project: Project): GeneratedFile {
  const shieldName = getShieldName(project);
  const custom = renderCustomBehaviors(project);
  const layers = project.layers
    .map((layer) => renderLayer(layer, { project, custom }))
    .join('\n\n');
  return {
    path: `boards/shields/${shieldName}/${shieldName}.keymap`,
    content: `${renderIncludes(project)}

/ {
${custom.text}    keymap {
        compatible = "zmk,keymap";

${layers}
    };
};
`,
  };
}
