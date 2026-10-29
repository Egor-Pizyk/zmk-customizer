import { getWireSections } from '@domain/wires';
import type { Project } from '@domain';
import type { SchematicSelection } from '@ui/schematic/interaction';

export function getSelectedWireIds(
  project: Project,
  selection: SchematicSelection,
): ReadonlySet<string> {
  if (selection?.kind === 'wire' || selection?.kind === 'wire-end') {
    return new Set([selection.wireId]);
  }
  if (selection?.kind === 'multi') {
    return new Set(selection.wireIds);
  }
  if (selection?.kind === 'sections' && selection.base === project) {
    return new Set(
      getWireSections(project)
        .filter((section) => selection.sectionIds.includes(section.id))
        .map((section) => section.wireId),
    );
  }
  return new Set();
}
