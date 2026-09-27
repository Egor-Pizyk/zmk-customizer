import { useRef } from 'react';
import type { PointerEvent } from 'react';
import type { Viewport } from '../../storage/preferences';
import type { ElementSize } from './use-element-size';
import { PX_PER_U, screenToWorld } from './viewport';

const MINIMAP_WIDTH_PX = 160;
const MINIMAP_HEIGHT_PX = 72;
// Default content area until keys exist (spec 001 data-model); padded so edges stay visible.
const CONTENT = { xU: 0, yU: 0, widthU: 20, heightU: 8 };
const PADDING_U = 2;
const WORLD = {
  xU: CONTENT.xU - PADDING_U,
  yU: CONTENT.yU - PADDING_U,
  widthU: CONTENT.widthU + PADDING_U * 2,
  heightU: CONTENT.heightU + PADDING_U * 2,
};
const SCALE = Math.min(MINIMAP_WIDTH_PX / WORLD.widthU, MINIMAP_HEIGHT_PX / WORLD.heightU);

type MinimapProps = {
  readonly viewport: Viewport;
  readonly surfaceSize: ElementSize;
  readonly onPanDraft: (viewport: Viewport) => void;
  readonly onPanCommit: (viewport: Viewport) => void;
};

function toMinimap(valueU: number, originU: number): number {
  return (valueU - originU) * SCALE;
}

// Pointer-only shortcut, hidden from assistive tech: keyboard users pan with arrows on the canvas
// (contracts/ui-regions.md). jsx-a11y rejects role="img" on an <svg>.
export function Minimap({ viewport, surfaceSize, onPanDraft, onPanCommit }: MinimapProps) {
  const drag = useMinimapDrag({ viewport, surfaceSize, onPanDraft, onPanCommit });
  const topLeft = screenToWorld({ xPx: 0, yPx: 0 }, viewport);
  const size = { xPx: surfaceSize.widthPx, yPx: surfaceSize.heightPx };
  const bottomRight = screenToWorld(size, viewport);
  return (
    <svg
      aria-hidden="true"
      className="absolute right-2 bottom-2 cursor-pointer touch-none rounded-md border border-border bg-surface-raised"
      height={MINIMAP_HEIGHT_PX}
      onPointerDown={drag.handlePointerDown}
      onLostPointerCapture={drag.handlePointerEnd}
      onPointerCancel={drag.handlePointerEnd}
      onPointerMove={drag.handlePointerMove}
      onPointerUp={drag.handlePointerEnd}
      width={MINIMAP_WIDTH_PX}
    >
      <rect
        className="fill-surface-muted stroke-border-strong"
        height={CONTENT.heightU * SCALE}
        width={CONTENT.widthU * SCALE}
        x={toMinimap(CONTENT.xU, WORLD.xU)}
        y={toMinimap(CONTENT.yU, WORLD.yU)}
      />
      <rect
        className="fill-none stroke-accent"
        height={(bottomRight.yU - topLeft.yU) * SCALE}
        strokeWidth={2}
        width={(bottomRight.xU - topLeft.xU) * SCALE}
        x={toMinimap(topLeft.xU, WORLD.xU)}
        y={toMinimap(topLeft.yU, WORLD.yU)}
      />
    </svg>
  );
}

type MinimapGrab = {
  /** World offset from the view center to the grabbed point; 0 when the press missed the frame. */
  readonly offsetXU: number;
  readonly offsetYU: number;
};

function worldAt(event: PointerEvent<SVGSVGElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  return {
    xU: (event.clientX - bounds.left) / SCALE + WORLD.xU,
    yU: (event.clientY - bounds.top) / SCALE + WORLD.yU,
  };
}

function grabAt(event: PointerEvent<SVGSVGElement>, props: MinimapProps): MinimapGrab {
  const { viewport, surfaceSize } = props;
  const point = worldAt(event);
  const topLeft = screenToWorld({ xPx: 0, yPx: 0 }, viewport);
  const bottomRight = screenToWorld(
    { xPx: surfaceSize.widthPx, yPx: surfaceSize.heightPx },
    viewport,
  );
  const isInsideFrame =
    point.xU >= topLeft.xU &&
    point.xU <= bottomRight.xU &&
    point.yU >= topLeft.yU &&
    point.yU <= bottomRight.yU;
  return isInsideFrame
    ? {
        offsetXU: point.xU - (topLeft.xU + bottomRight.xU) / 2,
        offsetYU: point.yU - (topLeft.yU + bottomRight.yU) / 2,
      }
    : { offsetXU: 0, offsetYU: 0 };
}

// Moves the view so the grabbed point follows the pointer; a press outside the frame centers it.
function viewportAt(
  event: PointerEvent<SVGSVGElement>,
  props: MinimapProps,
  grab: MinimapGrab,
): Viewport {
  const { viewport, surfaceSize } = props;
  const point = worldAt(event);
  const pxPerU = PX_PER_U * viewport.zoom;
  return {
    zoom: viewport.zoom,
    panXPx: surfaceSize.widthPx / 2 - (point.xU - grab.offsetXU) * pxPerU,
    panYPx: surfaceSize.heightPx / 2 - (point.yU - grab.offsetYU) * pxPerU,
  };
}

// Drag writes the surface draft; release (or a plain click) commits (research R15).
function useMinimapDrag(props: MinimapProps) {
  const grabRef = useRef<MinimapGrab | null>(null);
  const draftRef = useRef<Viewport | null>(null);

  function endDrag() {
    if (draftRef.current !== null) {
      props.onPanCommit(draftRef.current);
    }
    grabRef.current = null;
    draftRef.current = null;
  }

  return {
    // Primary button only: a right-click never sends pointerup on macOS.
    handlePointerDown: (event: PointerEvent<SVGSVGElement>) => {
      if (event.button !== 0) {
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      grabRef.current = grabAt(event, props);
      draftRef.current = viewportAt(event, props, grabRef.current);
      props.onPanDraft(draftRef.current);
    },
    handlePointerMove: (event: PointerEvent<SVGSVGElement>) => {
      if (grabRef.current !== null) {
        draftRef.current = viewportAt(event, props, grabRef.current);
        props.onPanDraft(draftRef.current);
      }
    },
    handlePointerEnd: endDrag,
  };
}
