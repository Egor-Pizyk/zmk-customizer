import type { WirePoint } from '@domain';
import { toPathData } from '@ui/canvas/logic';

type WireShapeProps = {
  readonly wireId: string;
  readonly sectionId?: string;
  readonly path: readonly WirePoint[];
  readonly label: string;
  readonly isSelected: boolean;
  readonly pxPerU: number;
};

const HIT_WIDTH_PX = 12;

// Pointer only; the Parts list is the keyboard path for wires (003 R10, contracts/ui.md). The
// invisible wide stroke is the 12 px pointer target (003 R9).
export function WireShape({ wireId, path, label, isSelected, pxPerU, sectionId }: WireShapeProps) {
  const pathData = toPathData(path);
  return (
    <g aria-label={label} data-wire-id={wireId} data-section-id={sectionId} role="graphics-symbol">
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
      {isSelected ? <SectionEndpoints path={path} pxPerU={pxPerU} /> : undefined}
    </g>
  );
}

function SectionEndpoints({ path, pxPerU }: Pick<WireShapeProps, 'path' | 'pxPerU'>) {
  return [path[0], path.at(-1)].map((point) =>
    point === undefined ? undefined : (
      <circle
        key={`${point.xU}:${point.yU}`}
        cx={point.xU}
        cy={point.yU}
        r={4 / pxPerU}
        className="fill-surface stroke-accent"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />
    ),
  );
}
