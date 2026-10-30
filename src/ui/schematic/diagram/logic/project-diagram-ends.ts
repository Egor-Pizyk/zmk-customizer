import { toEndMark } from '@ui/schematic/rendering/logic';
import { buildDiagramCell, diagramNode } from './diagram-node';
import type { Wire, WireEndSide, WirePoint } from '@domain';
import type { DiagramArtworkInput } from './project-diagram';

type EndInput = {
  readonly wire: Wire;
  readonly side: WireEndSide;
  readonly at: WirePoint;
  readonly pxPerU: number;
  readonly hasProblem: boolean;
};
export function projectDiagramEnds({ project, paths, marks, view }: DiagramArtworkInput) {
  return project.wires.flatMap((wire, wireIndex) =>
    (['start', 'end'] as const).flatMap((side) => {
      const end = wire[side];
      const path = paths.get(wire.id);
      const at = side === 'start' ? path?.[0] : path?.at(-1);
      if (end.kind === 'key-pin' || end.kind === 'encoder-pin' || at === undefined) {
        return [];
      }
      if (end.kind === 'junction') {
        return [
          buildDiagramCell(
            `end:${wire.id}:${side}`,
            diagramNode('circle', {
              'aria-hidden': 'true',
              class: 'fill-text',
              cx: at.xU,
              cy: at.yU,
              r: 4 / view.pxPerU,
              'pointer-events': 'none',
            }),
          ),
        ];
      }
      return [
        freeEnd({
          wire,
          side,
          at,
          pxPerU: view.pxPerU,
          hasProblem: marks.problemEnds.has(toEndMark({ wireIndex, side })),
        }),
      ];
    }),
  );
}
function freeEnd({ wire, side, at, pxPerU, hasProblem }: EndInput) {
  const end = wire[side];
  const radius = 4 / pxPerU;
  const hasBoardPin =
    end.kind === 'free' &&
    (end.boardPin !== undefined || end.terminalId !== undefined || end.ground === true);
  return buildDiagramCell(
    `end:${wire.id}:${side}`,
    diagramNode(
      'g',
      {
        'aria-hidden': 'true',
        class: 'group',
        'data-wire-end': side,
        'data-wire-id': wire.id,
        ...(hasProblem ? { 'data-conflict': 'true' } : {}),
      },
      [
        diagramNode('circle', {
          class: 'fill-none',
          cx: at.xU,
          cy: at.yU,
          'pointer-events': 'all',
          'stroke-width': 0,
          r: 12 / pxPerU,
        }),
        endCap(at, radius, hasBoardPin),
        ...(hasProblem ? [endWarning(at, radius)] : []),
      ],
    ),
  );
}
function endWarning(at: WirePoint, radius: number) {
  return diagramNode('path', {
    class: 'fill-danger',
    d: `M ${at.xU + radius * 1.2} ${at.yU - radius * 3} l ${radius} ${radius * 1.8} h ${-radius * 2} z`,
  });
}
function endCap(at: WirePoint, radius: number, hasBoardPin: boolean) {
  return hasBoardPin
    ? diagramNode('path', {
        class: 'fill-text group-data-conflict:fill-danger',
        d: `M ${at.xU - radius} ${at.yU - radius} h ${radius * 2} v ${radius * 2} h ${-radius * 2} z`,
      })
    : diagramNode('circle', {
        class: 'fill-surface stroke-text group-data-conflict:stroke-danger',
        cx: at.xU,
        cy: at.yU,
        r: radius,
        'stroke-width': 1.5,
        'vector-effect': 'non-scaling-stroke',
      });
}
