import { buildDiagramCell, diagramNode } from './diagram-node';
import type { DiagramArtworkInput } from './project-diagram';
import type { WirePoint } from '@domain';

export function projectDiagramBridges({ crossings, paths, view }: DiagramArtworkInput) {
  return crossings
    .filter((crossing) => crossing.isInsulated)
    .map((crossing) => {
      const { xU, yU } = crossing.at;
      const radius = 6 / view.pxPerU;
      const isHorizontal = isHorizontalAt(paths.get(crossing.ref.wireIds[1]) ?? [], crossing.at);
      const gap = isHorizontal
        ? `M ${xU - radius} ${yU} L ${xU + radius} ${yU}`
        : `M ${xU} ${yU - radius} L ${xU} ${yU + radius}`;
      const straight = isHorizontal
        ? `M ${xU} ${yU - radius} L ${xU} ${yU + radius}`
        : `M ${xU - radius} ${yU} L ${xU + radius} ${yU}`;
      const arc = isHorizontal
        ? `M ${xU - radius} ${yU} A ${radius} ${radius} 0 0 1 ${xU + radius} ${yU}`
        : `M ${xU} ${yU - radius} A ${radius} ${radius} 0 0 1 ${xU} ${yU + radius}`;
      return buildDiagramCell(
        `crossing:${crossing.ref.wireIds.join(':')}:${crossing.ref.ordinal}`,
        diagramNode('g', { 'aria-hidden': 'true', 'pointer-events': 'none' }, [
          bridgeStroke(gap, 'stroke-surface', 5),
          bridgeStroke(straight, 'stroke-text', 2),
          bridgeStroke(arc, 'fill-none stroke-text', 2),
        ]),
      );
    });
}
function isHorizontalAt(path: readonly WirePoint[], at: WirePoint) {
  return path.some((from, index) => {
    const to = path[index + 1];
    return (
      to !== undefined &&
      from.yU === to.yU &&
      from.yU === at.yU &&
      at.xU >= Math.min(from.xU, to.xU) &&
      at.xU <= Math.max(from.xU, to.xU)
    );
  });
}

function bridgeStroke(path: string, className: string, width: number) {
  return diagramNode('path', {
    class: className,
    d: path,
    'stroke-width': width,
    'vector-effect': 'non-scaling-stroke',
  });
}
