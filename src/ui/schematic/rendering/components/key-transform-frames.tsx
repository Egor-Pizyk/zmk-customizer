import { getEncoderGeometry, getKeyCenter, getKeyGeometry } from '@domain/geometry';
import type { Key, Project } from '@domain';
import { toScreenPoint } from '@ui/canvas/logic';
import type { ContentView } from '@ui/canvas/logic';
import { getSelectedKeyIds, TRANSFORM_HANDLES } from '@ui/schematic/interaction';
import type { SchematicSelection } from '@ui/schematic/interaction';

const BOTTOM_RIGHT_HANDLE = TRANSFORM_HANDLES.find((handle) => handle.name === 'bottom right');

export function KeyTransformFrames({
  project,
  selection,
  view,
}: {
  readonly project: Project;
  readonly selection: SchematicSelection;
  readonly view: ContentView;
}) {
  const keyIds = getSelectedKeyIds(selection, { project });
  const encoder =
    selection?.kind === 'encoder'
      ? project.encoders.find((entry) => entry.id === selection.encoderId)
      : undefined;
  return (
    <>
      {project.keys.map((key, keyIndex) =>
        keyIds.includes(key.id) ? (
          <KeyTransformFrame key={key.id} schematicKey={key} keyIndex={keyIndex} view={view} />
        ) : null,
      )}
      {encoder === undefined ? null : (
        <EncoderTransformFrame
          encoderId={encoder.id}
          encoderIndex={project.encoders.indexOf(encoder)}
          geometry={getEncoderGeometry(project, encoder)}
          view={view}
        />
      )}
    </>
  );
}

type EncoderTransformFrameProps = {
  readonly encoderId: string;
  readonly encoderIndex: number;
  readonly geometry: { readonly xU: number; readonly yU: number; readonly rotationDeg: number };
  readonly view: ContentView;
};

function EncoderTransformFrame({
  encoderId,
  encoderIndex,
  geometry,
  view,
}: EncoderTransformFrameProps) {
  const center = toScreenPoint(view, {
    xU: geometry.xU + 0.5,
    yU: geometry.yU + 0.5,
  });
  const size = view.pxPerU;
  return (
    <g transform={`translate(${center.xPx} ${center.yPx}) rotate(${geometry.rotationDeg})`}>
      <rect
        className="pointer-events-none fill-none stroke-accent"
        x={-size / 2}
        y={-size / 2}
        width={size}
        height={size}
        strokeWidth={1}
      />
      {BOTTOM_RIGHT_HANDLE === undefined ? null : (
        <EncoderTransformHandle
          encoderId={encoderId}
          encoderIndex={encoderIndex}
          handle={BOTTOM_RIGHT_HANDLE}
          size={size}
        />
      )}
    </g>
  );
}

function EncoderTransformHandle({
  encoderId,
  encoderIndex,
  handle,
  size,
}: {
  readonly encoderId: string;
  readonly encoderIndex: number;
  readonly handle: (typeof TRANSFORM_HANDLES)[number];
  readonly size: number;
}) {
  const offset = 20;
  const x = handle.x * (size / 2 + offset);
  const y = handle.y * (size / 2 + offset);
  return (
    <g data-encoder-rotate={encoderId} className="cursor-grab">
      <circle cx={x} cy={y} r={12} className="fill-none" pointerEvents="all" strokeWidth={0} />
      <text
        aria-hidden="true"
        className="pointer-events-none fill-accent text-base"
        dominantBaseline="central"
        textAnchor="middle"
        x={x}
        y={y}
      >
        ↻
      </text>
      <title>{`Rotate encoder ${encoderIndex} ${handle.name}`}</title>
    </g>
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
      {BOTTOM_RIGHT_HANDLE === undefined ? null : (
        <TransformHandle
          keyId={schematicKey.id}
          keyIndex={keyIndex}
          handle={BOTTOM_RIGHT_HANDLE}
          width={width}
          height={height}
        />
      )}
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
    <span aria-hidden="true" className="text-accent">
      ↻
    </span>
  );
}
