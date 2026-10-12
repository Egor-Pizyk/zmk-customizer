import type { CanvasWorkspaceId, Viewport } from '../../storage/preferences';

/** Screen px per key unit at zoom 1. */
export const PX_PER_U = 48;

const MIN_GRID_STEP_PX = 6;

export type ScreenPoint = {
  readonly xPx: number;
  readonly yPx: number;
};

export type WorldPoint = {
  readonly xU: number;
  readonly yU: number;
};

export function screenToWorld(point: ScreenPoint, viewport: Viewport): WorldPoint {
  const pxPerU = PX_PER_U * viewport.zoom;
  return {
    xU: (point.xPx - viewport.panXPx) / pxPerU,
    yU: (point.yPx - viewport.panYPx) / pxPerU,
  };
}

// Render-only thinning: snapping keeps the real grid size (spec edge case, research R5).
export function displayGridStep(gridSizeU: number, zoom: number): number {
  let stepU = gridSizeU;
  while (stepU * PX_PER_U * zoom < MIN_GRID_STEP_PX) {
    stepU *= 2;
  }
  return stepU;
}

export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 4;
export const ZOOM_STEP = 1 + (0.25 * 2) / 3;
export const WHEEL_ZOOM_STEP = 1 + (0.1 * 2) / 3;

// Zooms so the world point under the anchor stays under it; zoom is clamped to 25–400%.
export function zoomAt(viewport: Viewport, factor: number, anchor: ScreenPoint): Viewport {
  const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, viewport.zoom * factor));
  if (zoom === viewport.zoom) {
    return viewport;
  }
  const world = screenToWorld(anchor, viewport);
  return {
    zoom,
    panXPx: anchor.xPx - world.xU * PX_PER_U * zoom,
    panYPx: anchor.yPx - world.yU * PX_PER_U * zoom,
  };
}

export function resetViewport(): Viewport {
  return { zoom: 1, panXPx: 0, panYPx: 0 };
}

export function centerViewportAt(
  viewport: Viewport,
  input: { readonly world: WorldPoint; readonly screen: ScreenPoint },
): Viewport {
  const pxPerU = PX_PER_U * viewport.zoom;
  return {
    ...viewport,
    panXPx: input.screen.xPx - input.world.xU * pxPerU,
    panYPx: input.screen.yPx - input.world.yU * pxPerU,
  };
}

export type PanDelta = {
  readonly dxU: number;
  readonly dyU: number;
};

// Panning right moves the content left.
export function panViewportByU(viewport: Viewport, delta: PanDelta): Viewport {
  const pxPerU = PX_PER_U * viewport.zoom;
  return {
    ...viewport,
    panXPx: viewport.panXPx - delta.dxU * pxPerU,
    panYPx: viewport.panYPx - delta.dyU * pxPerU,
  };
}

// Bindings mirrors the Schematic layout (spec 004 FR-001), so both canvases pan and zoom one
// stored view; the `bindings` entry in preferences stays for stored-value compatibility.
export const SHARED_VIEW_WORKSPACE_ID = 'schematic' satisfies CanvasWorkspaceId;
