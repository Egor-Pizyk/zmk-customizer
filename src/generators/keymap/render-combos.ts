import type { Binding, Combo, Project } from '@domain';
import { getComboNodeName } from '@domain/advanced-keymap';
import { renderBinding } from './render-binding';

type FindLabel = (binding: Extract<Binding, { kind: 'tap_dance' | 'mod_morph' }>) => string;
function renderCombo(
  combo: Combo,
  input: { readonly project: Project; readonly findCustomLabel: FindLabel },
): string {
  const keyPositions = combo.keyIds
    .map((id) => input.project.keys.findIndex((key) => key.id === id))
    .toSorted((first, second) => first - second);
  const layers = combo.layerIds
    .map((id) => input.project.layers.findIndex((layer) => layer.id === id))
    .toSorted((first, second) => first - second);
  const properties = [
    `timeout-ms = <${combo.timeoutMs}>;`,
    `key-positions = <${keyPositions.join(' ')}>;`,
    `bindings = <${renderBinding(combo.binding, input)}>;`,
  ];
  if (layers.length > 0) {
    properties.push(`layers = <${layers.join(' ')}>;`);
  }
  return `        ${getComboNodeName(combo)} {\n${properties.map((line) => `            ${line}`).join('\n')}\n        };`;
}
export function renderCombos(project: Project, findCustomLabel: FindLabel): string {
  if (project.combos.length === 0) {
    return '';
  }
  const definitions = project.combos
    .toSorted((first, second) => (getComboNodeName(first) < getComboNodeName(second) ? -1 : 1))
    .map((combo) => renderCombo(combo, { project, findCustomLabel }));
  return `    combos {\n        compatible = "zmk,combos";\n${definitions.join('\n')}\n    };\n\n`;
}
