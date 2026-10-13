import { getKeyCenter } from '../../domain/get-key-center';
import { getKeyGeometry } from '../../domain/get-key-geometry';
import type { Key, Project } from '../../domain/types';
import type { ContentView } from '../canvas/surface-content';
import { toScreenPoint } from '../canvas/to-screen-point';
import { getSelectedKeyIds } from './get-selected-key-ids';
import type { SchematicSelection } from './schematic-selection';
import { TRANSFORM_HANDLES } from './transform-handles';

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
      {TRANSFORM_HANDLES.map((handle) => (
        <TransformHandle
          key={handle.name}
          keyId={schematicKey.id}
          keyIndex={keyIndex}
          handle={handle}
          width={width}
          height={height}
        />
      ))}
      {TRANSFORM_HANDLES.filter((handle) => handle.x !== 0 && handle.y !== 0).map((handle) => (
        <TransformHandle
          key={`rotate-${handle.name}`}
          keyId={schematicKey.id}
          keyIndex={keyIndex}
          handle={handle}
          width={width}
          height={height}
          isRotation
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
  readonly isRotation?: boolean;
};
function TransformHandle({
  keyId,
  keyIndex,
  handle,
  width,
  height,
  isRotation = false,
}: TransformHandleProps) {
  const offset = isRotation ? 20 : 0;
  const label = `${isRotation ? 'Rotate' : 'Resize'} key ${keyIndex} ${handle.name}`;
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
        data-key-transform={isRotation ? 'rotate' : 'resize'}
        data-transform-key-id={keyId}
        data-transform-handle={handle.name}
        className={`group flex size-full items-center justify-center focus-visible:outline-2 focus-visible:outline-focus ${isRotation ? 'cursor-grab' : handle.cursor}`}
      >
        <HandleMark isRotation={isRotation} />
      </button>
    </foreignObject>
  );
}

function HandleMark({ isRotation }: { readonly isRotation: boolean }) {
  return isRotation ? (
    <span
      aria-hidden="true"
      className="text-accent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      ↻
    </span>
  ) : (
    <span aria-hidden="true" className="size-2 border border-accent bg-surface-raised" />
  );
}
