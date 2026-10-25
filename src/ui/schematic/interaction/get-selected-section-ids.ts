import { getWireSections } from '@domain/wires';
import type { Project } from '@domain';
import type { SchematicSelection } from './schematic-selection';

export function getSelectedSectionIds(
  project: Project,
  selection: SchematicSelection,
): readonly string[] {
  if (selection?.kind === 'sections') {
    return selection.base === project ? selection.sectionIds : [];
  }
  if (selection?.kind === 'wire') {
    return getWireSections(project)
      .filter((section) => section.wireId === selection.wireId)
      .map((section) => section.id);
  }
  return [];
}
