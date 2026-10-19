import type { Project } from '@domain';

export function findAdvancedResourceError(project: Project): string | undefined {
  if (
    project.combos.length > 128 ||
    project.macros.length > 128 ||
    project.conditionalLayers.length > 128
  ) {
    return 'Advanced keymap collections can have at most 128 entries.';
  }
  for (const combo of project.combos) {
    if (combo.name.length > 160 || combo.keyIds.length > 20 || combo.layerIds.length > 32) {
      return 'A combo exceeds its name/key/layer processing budget.';
    }
  }
  for (const macro of project.macros) {
    if (macro.name.length > 160 || macro.steps.length > 64) {
      return 'A macro exceeds its name/step processing budget.';
    }
  }
  if (project.conditionalLayers.some((rule) => rule.ifLayerIds.length > 32)) {
    return 'A conditional rule can have at most 32 input layers.';
  }
  return undefined;
}
