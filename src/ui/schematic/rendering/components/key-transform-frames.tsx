import { getKeyCenter, getKeyGeometry } from '@domain/geometry';
import type { Key, Project } from '@domain';
import { toScreenPoint } from '@ui/canvas/logic';
import type { ContentView } from '@ui/canvas/logic';
import { getSelectedKeyIds, TRANSFORM_HANDLES } from '@ui/schematic/interaction';
import type { SchematicSelection } from '@ui/schematic/interaction';

export function KeyTransformFrames({
  project,
  selection,
  view,
}: {
  readonly project: Project;
  readonly selection: SchematicSelection;
  readonly view: ContentView;
}) {
  const keyIds = getSelectedKeyIds(selection);
  return project.keys.map((key, keyIndex) =>
    keyIds.includes(key.id) ? (
      <KeyTransformFrame key={key.id} schematicKey={key} keyIndex={keyIndex} view={view} />
    ) : null,
  );
}

type KeyTransformFrameProps = {
  readonly schematicKey: Key;
  readonly keyIndex: number;
  readonly view: ContentView;
};
function KeyTransformFrame({ schematicKey, keyIndex, view }: KeyTransformFrameProps) {
  const geometry = getKeyGeometry(schematicKey);
  const center = toScreenPoint(view, getKeyCenter(schematicKey));
  const width = geometry.widthU * view.pxPerU;
  const height = geometry.heightU * view.pxPerU;
  return (
    <g transform={`translate(${center.xPx} ${center.yPx}) rotate(${geometry.rotationDeg})`}>
      <rect
        className="pointer-events-none fill-none stroke-accent"
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        strokeWidth={1}
      />
      {TRANSFORM_HANDLES.filter((handle) => handle.x !== 0 && handle.y !== 0).map((handle) => (
        <TransformHandle
          key={`rotate-${handle.name}`}
          keyId={schematicKey.id}
          keyIndex={keyIndex}
          handle={handle}
          width={width}
          height={height}
        />
      ))}
    </g>
  );
}

type TransformHandleProps = {
  readonly keyId: string;
  readonly keyIndex: number;
  readonly handle: (typeof TRANSFORM_HANDLES)[number];
  readonly width: number;
  readonly height: number;
};
function TransformHandle({ keyId, keyIndex, handle, width, height }: TransformHandleProps) {
  const offset = 20;
  const label = `Rotate key ${keyIndex} ${handle.name}`;
  return (
    <foreignObject
      height={24}
      width={24}
      x={handle.x * (width / 2 + offset) - 12}
      y={handle.y * (height / 2 + offset) - 12}
    >
      <button
        aria-label={label}
        title={label}
        tabIndex={-1}
        type="button"
        data-key-transform="rotate"
        data-transform-key-id={keyId}
        data-transform-handle={handle.name}
        className="group flex size-full cursor-grab items-center justify-center focus-visible:outline-2 focus-visible:outline-focus"
      >
        <HandleMark />
      </button>
    </foreignObject>
  );
}

function HandleMark() {
  return (
    <span
      aria-hidden="true"
      className="text-accent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      ↻
    </span>
  );
}
