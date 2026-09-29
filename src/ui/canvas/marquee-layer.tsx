import type { WirePoint } from '../../domain/types';

export type Marquee = {
  readonly start: WirePoint;
  readonly end: WirePoint;
};

type MarqueeLayerProps = {
  readonly marquee: Marquee | undefined;
};

// Dashed accent rectangle showing the marquee selection area. Pointer-transparent and aria-hidden.
export function MarqueeLayer({ marquee }: MarqueeLayerProps) {
  if (marquee === undefined) {
    return null;
  }
  const minX = Math.min(marquee.start.xU, marquee.end.xU);
  const minY = Math.min(marquee.start.yU, marquee.end.yU);
  const width = Math.abs(marquee.end.xU - marquee.start.xU);
  const height = Math.abs(marquee.end.yU - marquee.start.yU);
  return (
    <g aria-hidden="true" pointerEvents="none">
      <rect
        className="fill-accent/10 stroke-accent"
        height={height}
        rx={0.05}
        strokeDasharray="4 3"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        width={width}
        x={minX}
        y={minY}
      />
    </g>
  );
}
