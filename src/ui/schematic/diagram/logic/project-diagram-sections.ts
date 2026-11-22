import { getWireSections } from '@domain/wires';
import { toPathData } from '@ui/canvas/logic';
import { buildDiagramCell, diagramNode } from './diagram-node';
import type { WirePoint } from '@domain';
import type { ProjectDiagramInput } from './project-diagram';

export function projectDiagramSections({ project, view, selection }: ProjectDiagramInput) {
  return getWireSections(project).map((section) => {
    const isSelected =
      (selection?.kind === 'wire' && selection.wireId === section.wireId) ||
      (selection?.kind === 'sections' &&
        selection.base === project &&
        selection.sectionIds.includes(section.id));
    const path = toPathData(section.path);
    return buildDiagramCell(
      `section:${section.id}`,
      diagramNode(
        'g',
        {
          'aria-label': `Wire section ${section.id}`,
          'data-wire-id': section.wireId,
          'data-section-id': section.id,
          role: 'graphics-symbol',
        },
        [
          diagramNode('path', sectionLine(path, isSelected)),
          diagramNode('path', {
            class: 'fill-none',
            d: path,
            'pointer-events': 'stroke',
            'stroke-width': 12,
            'vector-effect': 'non-scaling-stroke',
          }),
          ...(isSelected ? projectEndpoints(section.path, view.pxPerU) : []),
        ],
      ),
      { kind: 'section', wireId: section.wireId, sectionId: section.id },
    );
  });
}
function sectionLine(path: string, isSelected: boolean) {
  return {
    class: 'fill-none stroke-text data-selected:stroke-accent',
    d: path,
    ...(isSelected ? { 'data-selected': 'true' } : {}),
    'pointer-events': 'none',
    'stroke-linejoin': 'round',
    'stroke-width': isSelected ? 3 : 2,
    'vector-effect': 'non-scaling-stroke',
  };
}
function projectEndpoints(path: readonly WirePoint[], pxPerU: number) {
  return [path[0], path.at(-1)].flatMap((point) =>
    point === undefined
      ? []
      : [
          diagramNode('circle', {
            cx: point.xU,
            cy: point.yU,
            r: 4 / pxPerU,
            class: 'fill-surface stroke-accent',
            'stroke-width': 2,
            'vector-effect': 'non-scaling-stroke',
            'pointer-events': 'none',
          }),
        ],
  );
}
