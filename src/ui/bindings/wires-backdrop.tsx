import { formatBoardPin } from '../../domain/board-pin';
import { getWirePath } from '../../domain/get-wire-path';
import type { Project, Wire, WirePoint } from '../../domain/types';
import { getBoardPinLabels } from '../canvas/get-board-pin-labels';
import type { ContentView } from '../canvas/surface-content';
import { toPathData } from '../canvas/to-path-data';

type WiresBackdropProps = {
  readonly project: Project;
  readonly view: ContentView;
};

type WirePathEntry = { readonly wire: Wire; readonly path: readonly WirePoint[] };

const JUNCTION_RADIUS_PX = 4;
const LABEL_FONT_PX = 12;

// The schematic's wires as a dimmed, inert background (spec 004 FR-001, FR-002).
export function WiresBackdrop({ project, view }: WiresBackdropProps) {
  const entries = project.wires.map((wire) => ({ wire, path: getWirePath(project, wire) }));
  return (
    <g aria-hidden="true" className="opacity-40" pointerEvents="none">
      {entries.map(({ wire, path }) => (
        <path
          className="fill-none stroke-text"
          d={toPathData(path)}
          key={wire.id}
          strokeLinejoin="round"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <Junctions entries={entries} view={view} />
      {getBoardPinLabels(project).map(({ id, at, boardPin }) => (
        <text
          className="fill-text font-medium"
          fontSize={LABEL_FONT_PX / view.pxPerU}
          key={id}
          x={at.xU + 8 / view.pxPerU}
          y={at.yU + 4 / view.pxPerU}
        >
          {formatBoardPin(boardPin)}
        </text>
      ))}
    </g>
  );
}

function Junctions(props: {
  readonly entries: readonly WirePathEntry[];
  readonly view: ContentView;
}) {
  const radiusU = JUNCTION_RADIUS_PX / props.view.pxPerU;
  return props.entries.flatMap(({ wire, path }) =>
    (['start', 'end'] as const).flatMap((side) => {
      const at = side === 'start' ? path[0] : path.at(-1);
      return wire[side].kind === 'junction' && at !== undefined
        ? [
            <circle
              className="fill-text"
              cx={at.xU}
              cy={at.yU}
              key={`${wire.id}:${side}`}
              r={radiusU}
            />,
          ]
        : [];
    }),
  );
}
