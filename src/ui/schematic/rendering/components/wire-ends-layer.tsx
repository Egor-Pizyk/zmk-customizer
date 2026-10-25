import type { WireEndSide } from '@domain';
import type { SchematicLayerProps } from '@ui/schematic/rendering/logic';
import { toEndMark } from '@ui/schematic/rendering/logic';
import { WireEndMarker } from './wire-end-marker';

const SIDES: readonly WireEndSide[] = ['start', 'end'];
const JUNCTION_RADIUS_PX = 4;

// Junctions get a dot (FR-010); free ends get a cap or a board pin square.
export function WireEndsLayer({ project, view, paths, marks }: SchematicLayerProps) {
  return project.wires.flatMap((wire, wireIndex) =>
    SIDES.flatMap((side) => {
      const end = wire[side];
      const path = paths.get(wire.id) ?? [];
      const at = side === 'start' ? path[0] : path.at(-1);
      if (end.kind === 'key-pin' || end.kind === 'encoder-pin' || at === undefined) {
        return [];
      }
      const key = `${wire.id}:${side}`;
      if (end.kind === 'junction') {
        const radiusU = JUNCTION_RADIUS_PX / view.pxPerU;
        return [
          <circle
            aria-hidden="true"
            className="fill-text"
            cx={at.xU}
            cy={at.yU}
            key={key}
            pointerEvents="none"
            r={radiusU}
          />,
        ];
      }
      return [
        <WireEndMarker
          at={at}
          hasBoardPin={
            end.boardPin !== undefined || end.terminalId !== undefined || end.ground === true
          }
          hasProblem={marks.problemEnds.has(toEndMark({ wireIndex, side }))}
          key={key}
          pxPerU={view.pxPerU}
          side={side}
          wireId={wire.id}
        />,
      ];
    }),
  );
}
