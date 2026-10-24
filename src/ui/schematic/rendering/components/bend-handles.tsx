import type { WireBendHandle } from '@ui/schematic/rendering/logic';

type BendHandlesProps = {
  readonly handles: readonly WireBendHandle[];
  readonly pxPerU: number;
};

const MARKER_SIZE_PX = 8;

// Every visible right-angle corner is a drag target, including corners derived from endpoints.
export function BendHandles({ handles, pxPerU }: BendHandlesProps) {
  const markerSizeU = MARKER_SIZE_PX / pxPerU;
  return handles.map(({ wireId, point, bendIndex }) => (
    <rect
      className="fill-surface stroke-accent"
      data-wire-bend=""
      data-bend-index={bendIndex}
      data-bend-x-u={point.xU}
      data-bend-y-u={point.yU}
      data-wire-id={wireId}
      height={markerSizeU}
      key={`${point.xU}:${point.yU}`}
      strokeWidth={1.5}
      vectorEffect="non-scaling-stroke"
      width={markerSizeU}
      x={point.xU - markerSizeU / 2}
      y={point.yU - markerSizeU / 2}
    />
  ));
}
