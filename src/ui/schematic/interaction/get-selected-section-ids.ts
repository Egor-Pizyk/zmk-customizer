import { getWireSections } from '@domain/wires';
import type { Project } from '@domain';
import type { SchematicSelection } from './schematic-selection';

// The Parts rows ask the same whole-wire query repeatedly. Profiled corner drags spent most
// of their time recomputing these sections; immutable Project identity safely bounds this cache.
const sectionsByProject = new WeakMap<Project, ReadonlyMap<string, readonly string[]>>();

export function getSelectedSectionIds(
  project: Project,
  selection: SchematicSelection,
): readonly string[] {
  if (selection?.kind === 'sections') {
    return selection.base === project ? selection.sectionIds : [];
  }
  if (selection?.kind === 'wire') {
    return indexSections(project).get(selection.wireId) ?? [];
  }
  return [];
}

function indexSections(project: Project) {
  const cached = sectionsByProject.get(project);
  if (cached !== undefined) {
    return cached;
  }
  const index = new Map<string, string[]>();
  for (const section of getWireSections(project)) {
    const ids = index.get(section.wireId) ?? [];
    ids.push(section.id);
    index.set(section.wireId, ids);
  }
  sectionsByProject.set(project, index);
  return index;
}
