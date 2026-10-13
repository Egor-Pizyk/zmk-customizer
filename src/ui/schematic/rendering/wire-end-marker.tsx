import type { WireEndSide, WirePoint } from '@domain';

type WireEndMarkerProps = {
  readonly wireId: string;
  readonly side: WireEndSide;
  readonly at: WirePoint;
  readonly hasBoardPin: boolean;
  readonly hasProblem: boolean;
  readonly pxPerU: number;
};

const RADIUS_PX = 4;
const HIT_RADIUS_PX = 12;

// A free end: hollow cap without a board pin, small filled square with one (its label is drawn
// unscaled in the screen layer); a problem adds a warning mark and the danger color.
export function WireEndMarker(props: WireEndMarkerProps) {
  const { wireId, side, at, hasBoardPin, hasProblem, pxPerU } = props;
  const radiusU = RADIUS_PX / pxPerU;
  const { xU, yU } = at;
  const warning = `M ${xU + radiusU * 1.2} ${yU - radiusU * 3} l ${radiusU} ${radiusU * 1.8} h ${-radiusU * 2} z`;
  return (
    <g
      aria-hidden="true"
      className="group"
      data-conflict={hasProblem || undefined}
      data-wire-end={side}
      data-wire-id={wireId}
    >
      <circle
        className="fill-none"
        cx={xU}
        cy={yU}
        pointerEvents="all"
        r={HIT_RADIUS_PX / pxPerU}
      />
      <EndCap at={at} hasBoardPin={hasBoardPin} radiusU={radiusU} />
      {hasProblem ? <path className="fill-danger" d={warning} /> : undefined}
    </g>
  );
}

type EndCapProps = {
  readonly at: WirePoint;
  readonly hasBoardPin: boolean;
  readonly radiusU: number;
};

function EndCap({ at, hasBoardPin, radiusU }: EndCapProps) {
  if (hasBoardPin) {
    const square = `M ${at.xU - radiusU} ${at.yU - radiusU} h ${radiusU * 2} v ${radiusU * 2} h ${-radiusU * 2} z`;
    return <path className="fill-text group-data-conflict:fill-danger" d={square} />;
  }
  return (
    <circle
      className="fill-surface stroke-text group-data-conflict:stroke-danger"
      cx={at.xU}
      cy={at.yU}
      r={radiusU}
      strokeWidth={1.5}
      vectorEffect="non-scaling-stroke"
    />
  );
}
