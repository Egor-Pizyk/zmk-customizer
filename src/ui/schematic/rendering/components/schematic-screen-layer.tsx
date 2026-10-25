import { DiodeButtons, CrossingButton } from '@ui/schematic/parts/components';
import { formatBoardPin } from '@domain/wires';
import { toggleCrossingInsulation } from '@domain/crossings';
import type { Crossing } from '@domain/crossings';
import type { Project } from '@domain';
import { toScreenPoint, getBoardPinLabels } from '@ui/canvas/logic';
import type { ContentView } from '@ui/canvas/logic';
import { formatCrossingLabel } from '@ui/schematic/formatting';

type SchematicScreenLayerProps = {
  readonly project: Project;
  readonly isReadOnly?: boolean | undefined;
  readonly view: ContentView;
  readonly crossings: readonly Crossing[];
  readonly commit: (change: (project: Project) => Project) => void;
};

// Below 50% zoom buttons would pile up; the Crossings table stays the path there (003 A3).
const CROSSING_BUTTON_MIN_ZOOM = 0.5;
const BUTTON_OFFSET_PX = 6;
// WCAG 2.5.8 target size.
const CROSSING_BUTTON_SIZE_PX = 24;

// Buttons sit up-right of the crossing so the bridge stays visible; several at one point form a
// row (003 G2).
function getButtonOffsets(crossings: readonly Crossing[]): readonly number[] {
  const countByPoint = new Map<string, number>();
  return crossings.map((crossing) => {
    const pointKey = `${crossing.at.xU},${crossing.at.yU}`;
    const index = countByPoint.get(pointKey) ?? 0;
    countByPoint.set(pointKey, index + 1);
    return index * CROSSING_BUTTON_SIZE_PX;
  });
}

// Unscaled layer: text and controls keep their screen size at any zoom.
export function SchematicScreenLayer(props: SchematicScreenLayerProps) {
  const { project, view } = props;
  return (
    <>
      {getBoardPinLabels(project).map(({ id, at, boardPin, label, anchor }) => {
        const { xPx, yPx } = toScreenPoint(view, at);
        return (
          <text
            aria-hidden="true"
            className="fill-text text-xs font-medium"
            key={id}
            x={xPx + (anchor === 'end' ? -8 : 8)}
            textAnchor={anchor}
            y={yPx + 4}
          >
            {label ?? (boardPin === undefined ? '' : formatBoardPin(boardPin))}
          </text>
        );
      })}
      {props.isReadOnly === true ? null : (
        <DiodeButtons commit={props.commit} project={project} view={view} />
      )}
      {props.isReadOnly === true || view.zoom < CROSSING_BUTTON_MIN_ZOOM ? undefined : (
        <CrossingButtons {...props} />
      )}
    </>
  );
}

function CrossingButtons({ project, view, crossings, commit }: SchematicScreenLayerProps) {
  const offsets = getButtonOffsets(crossings);
  return crossings.map((crossing, index) => {
    const { xPx, yPx } = toScreenPoint(view, crossing.at);
    function handleToggle() {
      commit((current) => toggleCrossingInsulation(current, { ref: crossing.ref }));
    }
    return (
      <CrossingButton
        isInsulated={crossing.isInsulated}
        key={`${crossing.ref.wireIds.join('×')}:${crossing.ref.ordinal}`}
        label={formatCrossingLabel(project, crossing)}
        onToggle={handleToggle}
        sizePx={CROSSING_BUTTON_SIZE_PX}
        xPx={xPx + BUTTON_OFFSET_PX + (offsets[index] ?? 0)}
        yPx={yPx - BUTTON_OFFSET_PX - CROSSING_BUTTON_SIZE_PX}
      />
    );
  });
}
