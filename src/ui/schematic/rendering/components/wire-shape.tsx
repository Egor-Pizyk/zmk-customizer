import type { WirePoint } from '@domain';
import { BendHandles } from './bend-handles';
import { toPathData } from '@ui/canvas/logic';

type WireShapeProps = {
  readonly wireId: string;
  readonly path: readonly WirePoint[];
  readonly label: string;
  readonly isSelected: boolean;
  readonly bends: readonly WirePoint[];
  readonly pxPerU: number;
};

const HIT_WIDTH_PX = 12;

// Pointer only; the Parts list is the keyboard path for wires (003 R10, contracts/ui.md). The
// invisible wide stroke is the 12 px pointer target (003 R9).
export function WireShape({ wireId, path, label, isSelected, bends, pxPerU }: WireShapeProps) {
  const pathData = toPathData(path);
  return (
    <g aria-label={label} data-wire-id={wireId} role="graphics-symbol">
      <path
        className="fill-none stroke-text data-selected:stroke-accent"
        d={pathData}
        data-selected={isSelected || undefined}
        pointerEvents="none"
        strokeLinejoin="round"
        strokeWidth={isSelected ? 3 : 2}
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="fill-none"
        d={pathData}
        pointerEvents="stroke"
        strokeWidth={HIT_WIDTH_PX}
        vectorEffect="non-scaling-stroke"
      />
      {isSelected ? <BendHandles bends={bends} pxPerU={pxPerU} wireId={wireId} /> : undefined}
    </g>
  );
}
