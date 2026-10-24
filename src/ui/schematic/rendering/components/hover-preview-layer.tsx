import { toPathData } from '@ui/canvas/logic';
import type { ContentView } from '@ui/canvas/logic';
import type { HoverPreview } from '@ui/schematic/interaction';

type HoverPreviewLayerProps = {
  readonly preview: HoverPreview;
  readonly view: ContentView;
};

const SNAP_RING_RADIUS_PX = 7;

// Dashed accent = not placed yet: the wire being drawn, the pin it would attach to, and the key
// the Key tool would place (danger when the cell is taken). Pointer-transparent and aria-hidden.
export function HoverPreviewLayer({ preview, view }: HoverPreviewLayerProps) {
  const { draftPath, snapTarget, ghostKey } = preview;
  return (
    <g aria-hidden="true" pointerEvents="none">
      {draftPath === undefined ? undefined : (
        <path
          className="fill-none stroke-accent"
          d={toPathData(draftPath)}
          strokeDasharray="4 3"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {snapTarget === undefined ? undefined : (
        <circle
          className="fill-none stroke-accent"
          cx={snapTarget.xU}
          cy={snapTarget.yU}
          r={SNAP_RING_RADIUS_PX / view.pxPerU}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      )}
      <PlacementPreview ghost={ghostKey} />
    </g>
  );
}

function PlacementPreview({ ghost }: { readonly ghost: HoverPreview['ghostKey'] }) {
  if (ghost === undefined) {
    return null;
  }
  const className = ghost.isFree ? 'fill-none stroke-accent' : 'fill-none stroke-danger';
  if (ghost.kind === 'encoder') {
    return (
      <circle
        className={className}
        cx={ghost.position.xU + 0.5}
        cy={ghost.position.yU + 0.5}
        data-encoder-preview="true"
        r={0.4}
        strokeDasharray="4 3"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    );
  }
  return (
    <rect
      className={className}
      height={0.92}
      rx={0.08}
      strokeDasharray="4 3"
      strokeWidth={2}
      vectorEffect="non-scaling-stroke"
      width={0.92}
      x={ghost.position.xU + 0.04}
      y={ghost.position.yU + 0.04}
    />
  );
}
