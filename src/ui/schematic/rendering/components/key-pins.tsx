import { getKeyPinPosition } from '@domain/wires/geometry';
import type { Key, KeyPin, WirePoint } from '@domain';

type KeyPinsProps = {
  readonly schematicKey: Key;
  readonly pxPerU: number;
  readonly isPinConnected: (pin: KeyPin) => boolean;
};

const KEY_PINS: readonly KeyPin[] = [1, 2];
const HIT_RADIUS_PX = 12;
const PIN_RADIUS_PX = 3.5;

// The transparent 12 px circle is the pointer target (003 R9); a small 1 / 2 tells the pins apart.
export function KeyPins({ schematicKey, pxPerU, isPinConnected }: KeyPinsProps) {
  return KEY_PINS.map((pin) => {
    const at = getKeyPinPosition(schematicKey, pin);
    return (
      <g aria-hidden="true" data-key-id={schematicKey.id} data-pin={pin} key={pin}>
        <circle
          className="fill-none"
          cx={at.xU}
          cy={at.yU}
          pointerEvents="all"
          strokeWidth={0}
          r={HIT_RADIUS_PX / pxPerU}
        />
        <PinDot at={at} isConnected={isPinConnected(pin)} radiusU={PIN_RADIUS_PX / pxPerU} />
        <text className="fill-text-muted" fontSize={0.11} x={at.xU - 0.05} y={at.yU + 0.17}>
          {pin}
        </text>
      </g>
    );
  });
}

type PinDotProps = {
  readonly at: WirePoint;
  readonly isConnected: boolean;
  readonly radiusU: number;
};

// Connected = filled dot; unconnected = hollow danger ring plus a warning mark (shape, not only
// color).
export function PinDot({ at, isConnected, radiusU }: PinDotProps) {
  const { xU, yU } = at;
  if (isConnected) {
    return <circle className="fill-text" cx={xU} cy={yU} r={radiusU} />;
  }
  const warning = `M ${xU + radiusU * 1.4} ${yU - radiusU * 3.2} l ${radiusU} ${radiusU * 1.8} h ${-radiusU * 2} z`;
  return (
    <>
      <circle
        className="fill-surface stroke-danger"
        cx={xU}
        cy={yU}
        r={radiusU}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      <path className="fill-danger" d={warning} />
    </>
  );
}
