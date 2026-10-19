import type { Binding, Project } from '@domain';
import { renderMacros } from './render-macros';
import { renderCombos } from './render-combos';
import { renderConditionalLayers } from './render-conditional-layers';

export function renderAdvancedKeymap(
  project: Project,
  findCustomLabel: (binding: Extract<Binding, { kind: 'tap_dance' | 'mod_morph' }>) => string,
): string {
  return (
    renderMacros(project, findCustomLabel) +
    renderCombos(project, findCustomLabel) +
    renderConditionalLayers(project)
  );
}
