import type { PointerEvent, ReactNode } from 'react';
import type { Viewport } from '@storage/preferences';
import { PX_PER_U, screenToWorld } from './viewport';
import type { WorldPoint } from './viewport';

export type ContentView = {
  /** Screen px per key unit at the current zoom; divide screen sizes by it to draw in u. */
  readonly pxPerU: number;
  readonly zoom: number;
  readonly panXPx: number;
  readonly panYPx: number;
};

export type ContentPointerHandler = (world: WorldPoint, event: PointerEvent<SVGSVGElement>) => void;

// World-space content drawn by a workspace (003 R3). Handlers get the primary button only; the
// middle button and the wheel stay with the surface for pan and zoom.
type SurfaceContentBase = {
  /** Drawn unscaled above `render`, for controls and text with a fixed screen size. */
  readonly renderScreen?: (view: ContentView) => ReactNode;
  readonly onPointerDown?: ContentPointerHandler;
  readonly onPointerMove?: ContentPointerHandler;
  readonly onPointerUp?: ContentPointerHandler;
  /** Pointer cancelled or capture lost: drop any drag preview without committing. */
  readonly onPointerCancel?: () => void;
  /** The pointer left the canvas: drop hover previews. */
  readonly onPointerLeave?: () => void;
  /** Accessible name of the canvas, e.g. "Schematic canvas, 4 keys". */
  readonly label?: string;
};

export type SurfaceContent =
  | (SurfaceContentBase & {
      readonly kind?: 'svg';
      readonly render: (view: ContentView) => ReactNode;
      readonly renderHost?: never;
    })
  | (Omit<SurfaceContentBase, 'onPointerDown' | 'onPointerMove' | 'onPointerUp'> & {
      readonly kind: 'host';
      readonly onPointerDown?: (world: WorldPoint, event: PointerEvent<HTMLDivElement>) => void;
      readonly onPointerMove?: (world: WorldPoint, event: PointerEvent<HTMLDivElement>) => void;
      readonly onPointerUp?: (world: WorldPoint, event: PointerEvent<HTMLDivElement>) => void;
      readonly render?: never;
      readonly renderHost: (view: ContentView) => ReactNode;
    });

export function toWorldPoint(
  event: { readonly clientX: number; readonly clientY: number; readonly currentTarget: Element },
  viewport: Viewport,
): WorldPoint {
  const bounds = event.currentTarget.getBoundingClientRect();
  return screenToWorld(
    { xPx: event.clientX - bounds.left, yPx: event.clientY - bounds.top },
    viewport,
  );
}

export function toContentView(viewport: Viewport): ContentView {
  return { ...viewport, pxPerU: PX_PER_U * viewport.zoom };
}
