import type { WirePoint } from '../../domain/types';

type CrossingBridgeProps = {
  readonly at: WirePoint;
  /** Path of the wire that hops over (`wireIds[1]`). */
  readonly hoppingPath: readonly WirePoint[];
  readonly pxPerU: number;
};

const RADIUS_PX = 6;

function isHorizontalAt(path: readonly WirePoint[], at: WirePoint): boolean {
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

// FR-015: an insulated crossing is drawn as a bridge; the hopping wire is cut and arcs over.
export function CrossingBridge({ at, hoppingPath, pxPerU }: CrossingBridgeProps) {
  const radiusU = RADIUS_PX / pxPerU;
  const isHorizontal = isHorizontalAt(hoppingPath, at);
  const { xU, yU } = at;
  const gap = isHorizontal
    ? `M ${xU - radiusU} ${yU} L ${xU + radiusU} ${yU}`
    : `M ${xU} ${yU - radiusU} L ${xU} ${yU + radiusU}`;
  const straight = isHorizontal
    ? `M ${xU} ${yU - radiusU} L ${xU} ${yU + radiusU}`
    : `M ${xU - radiusU} ${yU} L ${xU + radiusU} ${yU}`;
  const arc = isHorizontal
    ? `M ${xU - radiusU} ${yU} A ${radiusU} ${radiusU} 0 0 1 ${xU + radiusU} ${yU}`
    : `M ${xU} ${yU - radiusU} A ${radiusU} ${radiusU} 0 0 1 ${xU} ${yU + radiusU}`;
  return (
    <g aria-hidden="true" pointerEvents="none">
      <path className="stroke-surface" d={gap} strokeWidth={5} vectorEffect="non-scaling-stroke" />
      <path
        className="stroke-text"
        d={straight}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="fill-none stroke-text"
        d={arc}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}
