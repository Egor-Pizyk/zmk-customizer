import type { Project } from '@domain';

export function renderConditionalLayers(project: Project): string {
  if (project.conditionalLayers.length === 0) {
    return '';
  }
  const definitions = project.conditionalLayers
    .toSorted((first, second) => (first.id < second.id ? -1 : 1))
    .map((rule) => {
      const inputs = rule.ifLayerIds
        .map((id) => project.layers.findIndex((layer) => layer.id === id))
        .toSorted((first, second) => first - second);
      const target = project.layers.findIndex((layer) => layer.id === rule.thenLayerId);
      return `        user_rule_${rule.id} {
            if-layers = <${inputs.join(' ')}>;
            then-layer = <${target}>;
        };`;
    });
  return `    conditional_layers {\n        compatible = "zmk,conditional-layers";\n${definitions.join('\n')}\n    };\n\n`;
}
