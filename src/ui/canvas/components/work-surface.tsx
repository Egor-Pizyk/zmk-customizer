import { useEffect, useRef, useState } from 'react';
import type { PointerEvent, ReactNode, RefObject } from 'react';
import type { CanvasWorkspaceId, Viewport } from '@storage/preferences';
import { usePreferences } from '@ui/preferences';
import { SurfaceControls } from './surface-controls';
import { SurfaceOverlays } from './surface-overlays';
import {
  snapToGrid,
  toWorldPoint,
  useSurfaceViewport,
  SHARED_VIEW_WORKSPACE_ID,
  screenToWorld,
} from '@ui/canvas/logic';
import { StatusBar } from './status-bar';

import type {
  SurfaceContent,
  useSurfaceViewport as useSurfaceViewportType,
  ScreenPoint,
  WorldPoint,
} from '@ui/canvas/logic';
import { SurfaceSvg } from './surface-svg';

type WorkSurfaceProps = {
  /** Canvas identity for labels and data attributes; the viewport is shared across canvases. */
  readonly workspaceId: CanvasWorkspaceId;
  /** Overlays inside the surface, such as the tool window. */
  readonly children?: ReactNode;
  /** World-space content in key units, drawn above the grid. */
  readonly content?: SurfaceContent;
};

type PointerSubscriber = {
  readonly onMove: (event: PointerEvent<SVGSVGElement>) => void;
  readonly onLeave: () => void;
};

type Surface = ReturnType<typeof useSurfaceViewportType>;

function usePointerForwarding(content: SurfaceContent | undefined, surface: Surface) {
  const subscribersRef = useRef<Set<PointerSubscriber>>(new Set());
  const { viewport } = surface;

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    surface.drag.handlePointerMove(event);
    for (const subscriber of subscribersRef.current) {
      subscriber.onMove(event);
    }
    content?.onPointerMove?.(toWorldPoint(event, viewport), event);
  }

  function handlePointerLeave() {
    for (const subscriber of subscribersRef.current) {
      subscriber.onLeave();
    }
  }

  return { subscribersRef, handlePointerMove, handlePointerLeave };
}

export function WorkSurface({ workspaceId, children, content }: WorkSurfaceProps) {
  const { gridSizeU, isSnapEnabled } = usePreferences().preferences;
  const svgRef = useRef<SVGSVGElement>(null);
  const surface = useSurfaceViewport(SHARED_VIEW_WORKSPACE_ID, svgRef);
  const { viewport } = surface;
  const snapGridU = isSnapEnabled ? gridSizeU : undefined;
  const forwarding = usePointerForwarding(content, surface);
  const pointerInput = { snapGridU, subscribersRef: forwarding.subscribersRef, viewport };

  return (
    <div className="flex min-h-64 flex-1 flex-col">
      <SurfaceControls
        viewport={viewport}
        svgRef={svgRef}
        onViewportCommit={surface.handleViewportCommit}
      />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <SurfaceSvg
          content={content}
          drag={surface.drag}
          onPointerLeave={forwarding.handlePointerLeave}
          onPointerMove={forwarding.handlePointerMove}
          svgRef={svgRef}
          viewport={viewport}
          workspaceId={workspaceId}
        />
        <PointerOverlays {...pointerInput} surface={surface} svgRef={svgRef} />
        {children}
      </div>
      <PointerStatusBar
        gridSizeU={gridSizeU}
        isSnapEnabled={isSnapEnabled}
        {...pointerInput}
        zoom={viewport.zoom}
      />
    </div>
  );
}

// Local state: a 60 Hz pointer stream must not re-render the canvas content (perf).
// Each leaf subscribes to pointer events and re-renders only itself; WorkSurface stays still.
function usePointerPosition(input: {
  readonly subscribersRef: RefObject<Set<PointerSubscriber>>;
  readonly snapGridU: number | undefined;
  readonly viewport: Viewport;
}): WorldPoint | undefined {
  const [screenPoint, setScreenPoint] = useState<ScreenPoint | undefined>();
  const { viewport, snapGridU, subscribersRef } = input;
  useEffect(() => {
    const subscribers = subscribersRef.current;
    const subscriber: PointerSubscriber = {
      onMove: (event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setScreenPoint({ xPx: event.clientX - bounds.left, yPx: event.clientY - bounds.top });
      },
      onLeave: () => {
        setScreenPoint(undefined);
      },
    };
    subscribers.add(subscriber);
    return () => {
      subscribers.delete(subscriber);
    };
  }, [subscribersRef]);
  const world = screenPoint === undefined ? undefined : screenToWorld(screenPoint, viewport);
  return world === undefined || snapGridU === undefined
    ? world
    : { xU: snapToGrid(world.xU, snapGridU), yU: snapToGrid(world.yU, snapGridU) };
}

function PointerOverlays(input: {
  readonly subscribersRef: RefObject<Set<PointerSubscriber>>;
  readonly snapGridU: number | undefined;
  readonly viewport: Viewport;
  readonly surface: Surface;
  readonly svgRef: RefObject<SVGSVGElement | null>;
}) {
  const pointer = usePointerPosition(input);
  return <SurfaceOverlays pointer={pointer} surface={input.surface} svgRef={input.svgRef} />;
}

function PointerStatusBar(input: {
  readonly subscribersRef: RefObject<Set<PointerSubscriber>>;
  readonly snapGridU: number | undefined;
  readonly viewport: Viewport;
  readonly gridSizeU: number;
  readonly isSnapEnabled: boolean;
  readonly zoom: number;
}) {
  const pointer = usePointerPosition(input);
  return (
    <StatusBar
      gridSizeU={input.gridSizeU}
      isSnapEnabled={input.isSnapEnabled}
      pointer={pointer}
      zoom={input.zoom}
    />
  );
}
