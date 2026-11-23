import { getWireSections } from '@domain/wires';
import type { Project, RoutingSettings } from '@domain';
import type { WiringScope } from '@domain/wiring/editing';
import { getSelectedKeyIds } from '@ui/schematic/interaction';
import type { SchematicSelection } from '@ui/schematic/interaction';

export function getGenerationScope(
  project: Project,
  settings: RoutingSettings,
  selection: SchematicSelection,
): WiringScope {
  if (settings.preferredScope === 'all') {
    return { kind: 'all' };
  }
  if (settings.preferredScope === 'half') {
    return { kind: 'half', half: settings.preferredHalf ?? 'left' };
  }
  return {
    kind: 'selection',
    keyIds: getSelectedKeyIds(selection, { project }),
    netWireIds: selectedWireIds(project, selection),
  };
}

function selectedWireIds(project: Project, selection: SchematicSelection): readonly string[] {
  if (selection?.kind === 'wire' || selection?.kind === 'wire-end') {
    return [selection.wireId];
  }
  if (selection?.kind === 'multi') {
    return selection.wireIds;
  }
  if (selection?.kind === 'sections' && selection.base === project) {
    return [
      ...new Set(
        getWireSections(project)
          .filter((section) => selection.sectionIds.includes(section.id))
          .flatMap((section) => section.contributors),
      ),
    ];
  }
  return [];
}
