import { useEffect, useRef, useState } from 'react';
import type { PointerEvent, ReactNode, RefObject } from 'react';
import type { CanvasWorkspaceId, Viewport } from '../../storage/preferences';
import { usePreferences } from '../preferences-context';
import { SurfaceOverlays } from './surface-overlays';
import { snapToGrid } from './snap';
import { StatusBar } from './status-bar';
import { toWorldPoint } from './surface-content';
import type { SurfaceContent } from './surface-content';
import { SurfaceSvg } from './surface-svg';
import { useSurfaceViewport } from './use-surface-viewport';
import type { useSurfaceViewport as useSurfaceViewportType } from './use-surface-viewport';
import { SHARED_VIEW_WORKSPACE_ID, screenToWorld } from './viewport';
import type { ScreenPoint, WorldPoint } from './viewport';

type WorkSurfaceProps = {
  /** Canvas identity for labels and data attributes; the viewport is shared across canvases. */
  readonly workspaceId: CanvasWorkspaceId;
  /** Overlays inside the surface: tool window, minimap. */
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
        <PointerOverlays
          snapGridU={snapGridU}
          subscribersRef={forwarding.subscribersRef}
          surface={surface}
          svgRef={svgRef}
          viewport={viewport}
        />
        {children}
      </div>
      <PointerStatusBar
        gridSizeU={gridSizeU}
        isSnapEnabled={isSnapEnabled}
        snapGridU={snapGridU}
        subscribersRef={forwarding.subscribersRef}
        viewport={viewport}
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
