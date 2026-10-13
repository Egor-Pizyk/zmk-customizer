import type { WirePoint } from '@domain';
import { toSlotKeys } from '../parts/to-slot-keys';

type BendHandlesProps = {
  readonly wireId: string;
  readonly bends: readonly WirePoint[];
  readonly pxPerU: number;
};

const MARKER_SIZE_PX = 8;

// Drag targets for the bends of the selected wire; `data-bend-index` is read by read-canvas-hit.
export function BendHandles({ wireId, bends, pxPerU }: BendHandlesProps) {
  const markerSizeU = MARKER_SIZE_PX / pxPerU;
  return toSlotKeys({ prefix: wireId, count: bends.length }).map((slotKey, bendIndex) => {
    const bend = bends[bendIndex] ?? { xU: 0, yU: 0 };
    return (
      <rect
        className="fill-surface stroke-accent"
        data-bend-index={bendIndex}
        data-wire-id={wireId}
        height={markerSizeU}
        key={slotKey}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        width={markerSizeU}
        x={bend.xU - markerSizeU / 2}
        y={bend.yU - markerSizeU / 2}
      />
    );
  });
}
