import type { WirePoint } from '@domain';
import { toSlotKeys } from '@ui/schematic/parts/logic';

type BendHandlesProps = {
  readonly wireId: string;
  readonly path: readonly WirePoint[];
  readonly bends: readonly WirePoint[];
  readonly pxPerU: number;
};

const MARKER_SIZE_PX = 8;

// Every visible right-angle corner is a drag target, including corners derived from endpoints.
export function BendHandles({ wireId, path, bends, pxPerU }: BendHandlesProps) {
  const markerSizeU = MARKER_SIZE_PX / pxPerU;
  const pathCorners = getWireCorners(path);
  const corners = [
    ...pathCorners,
    ...bends.filter((bend) => !pathCorners.some((corner) => isSamePoint(corner, bend))),
  ];
  return toSlotKeys({ prefix: wireId, count: corners.length }).map((slotKey, cornerIndex) => {
    const bend = corners[cornerIndex] ?? { xU: 0, yU: 0 };
    const bendIndex = bends.findIndex((candidate) => isSamePoint(candidate, bend));
    return (
      <rect
        className="fill-surface stroke-accent"
        data-wire-bend=""
        data-bend-index={bendIndex === -1 ? undefined : bendIndex}
        data-bend-x-u={bend.xU}
        data-bend-y-u={bend.yU}
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

function getWireCorners(path: readonly WirePoint[]): readonly WirePoint[] {
  return path.slice(1, -1).filter((point, index) => {
    const previous = path[index];
    const next = path[index + 2];
    if (previous === undefined || next === undefined) {
      return false;
    }
    const entersHorizontally = previous.yU === point.yU;
    const leavesHorizontally = next.yU === point.yU;
    return entersHorizontally !== leavesHorizontally;
  });
}

function isSamePoint(first: WirePoint, second: WirePoint): boolean {
  return first.xU === second.xU && first.yU === second.yU;
}
