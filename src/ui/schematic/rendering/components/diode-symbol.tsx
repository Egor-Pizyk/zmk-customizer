import { getKeyPinPosition } from '@domain/wires';
import type { DiodePlacement } from '@ui/schematic/interaction';
import type { Key } from '@domain';

type DiodeSymbolProps = {
  readonly schematicKey: Key;
  readonly placement?: DiodePlacement | undefined;
  readonly pxPerU?: number;
};

export function DiodeSymbol({ schematicKey, placement, pxPerU = 48 }: DiodeSymbolProps) {
  const { diode } = schematicKey;
  if (diode === undefined) {
    return null;
  }
  const at = getKeyPinPosition(schematicKey, diode.pin);
  // The back is the physical pin; only polarity changes the body, never its leads.
  const rotation = diode.cathode === 'away-switch' ? 0 : 180;
  return (
    <g
      aria-hidden="true"
      className="fill-surface-raised stroke-text"
      data-key-id={schematicKey.id}
      data-pin={diode.pin}
      transform={`translate(${at.xU} ${at.yU}) rotate(${placement?.angle ?? -90})`}
    >
      <path
        d="M0 0 H0.105 M0.215 0 H0.32"
        fill="none"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      <g pointerEvents="none" transform={`translate(0.16 0) rotate(${rotation})`}>
        <path
          d="M-0.055 -0.055 V0.055 L0.055 0 Z M0.055 -0.065 V0.065"
          strokeWidth={1.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <circle
        className="fill-none stroke-none"
        cx={0.32}
        cy={0}
        r={12 / pxPerU}
        pointerEvents="all"
      />
    </g>
  );
}
