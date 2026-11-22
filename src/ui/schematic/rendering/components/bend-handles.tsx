import type { WireBendHandle } from '@ui/schematic/rendering/logic';

type BendHandlesProps = {
  readonly handles: readonly WireBendHandle[];
  readonly pxPerU: number;
};

const MARKER_SIZE_PX = 8;
const TARGET_SIZE_PX = 24;

export function BendHandles({ handles, pxPerU }: BendHandlesProps) {
  const markerSizeU = MARKER_SIZE_PX / pxPerU;
  const targetSizeU = TARGET_SIZE_PX / pxPerU;
  return handles.map(({ wireId, point, bendIndex }, index) => (
    <g
      data-wire-bend=""
      data-bend-index={bendIndex}
      data-bend-x-u={point.xU}
      data-bend-y-u={point.yU}
      data-wire-id={wireId}
      key={`${wireId}:${bendIndex ?? `derived:${index}`}`}
    >
      <rect
        className="fill-none"
        pointerEvents="all"
        strokeWidth={0}
        width={targetSizeU}
        height={targetSizeU}
        x={point.xU - targetSizeU / 2}
        y={point.yU - targetSizeU / 2}
      />
      <rect
        className="fill-surface stroke-accent"
        pointerEvents="none"
        height={markerSizeU}
        width={markerSizeU}
        x={point.xU - markerSizeU / 2}
        y={point.yU - markerSizeU / 2}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  ));
}
