import { useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import type { CanvasWorkspaceId, Viewport } from '../../storage/preferences';
import { usePreferences } from '../preferences-context';
import { SurfaceOverlays } from './surface-overlays';
import { snapToGrid } from './snap';
import { StatusBar } from './status-bar';
import { toWorldPoint } from './surface-content';
import type { SurfaceContent } from './surface-content';
import { SurfaceSvg } from './surface-svg';
import { useSurfaceViewport } from './use-surface-viewport';
import { SHARED_VIEW_WORKSPACE_ID, screenToWorld } from './viewport';
import type { ScreenPoint } from './viewport';

type WorkSurfaceProps = {
  /** Canvas identity for labels and data attributes; the viewport is shared across canvases. */
  readonly workspaceId: CanvasWorkspaceId;
  /** Overlays inside the surface: tool window, minimap. */
  readonly children?: ReactNode;
  /** World-space content in key units, drawn above the grid. */
  readonly content?: SurfaceContent;
};

export function WorkSurface({ workspaceId, children, content }: WorkSurfaceProps) {
  const { gridSizeU, isSnapEnabled } = usePreferences().preferences;
  const svgRef = useRef<SVGSVGElement>(null);
  const surface = useSurfaceViewport(SHARED_VIEW_WORKSPACE_ID, svgRef);
  const { viewport } = surface;
  const pointer = usePointerReadout(viewport, isSnapEnabled ? gridSizeU : undefined);

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    surface.drag.handlePointerMove(event);
    pointer.handlePointerMove(event);
    content?.onPointerMove?.(toWorldPoint(event, viewport), event);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <SurfaceSvg
          content={content}
          drag={surface.drag}
          onPointerLeave={pointer.handlePointerLeave}
          onPointerMove={handlePointerMove}
          svgRef={svgRef}
          viewport={viewport}
          workspaceId={workspaceId}
        />
        <SurfaceOverlays pointer={pointer.position} surface={surface} svgRef={svgRef} />
        {children}
      </div>
      <StatusBar
        gridSizeU={gridSizeU}
        isSnapEnabled={isSnapEnabled}
        pointer={pointer.position}
        zoom={viewport.zoom}
      />
    </div>
  );
}

// Local state: a 60 Hz pointer stream must not re-render the shell (plan Performance Goals).
// The screen point is stored and the world point derived in render, so the readout and ruler
// marker stay under the cursor while the view pans or zooms.
function usePointerReadout(viewport: Viewport, snapGridU: number | undefined) {
  const [screenPoint, setScreenPoint] = useState<ScreenPoint | undefined>();
  const world = screenPoint === undefined ? undefined : screenToWorld(screenPoint, viewport);
  const position =
    world === undefined || snapGridU === undefined
      ? world
      : { xU: snapToGrid(world.xU, snapGridU), yU: snapToGrid(world.yU, snapGridU) };
  return {
    position,
    handlePointerMove: (event: PointerEvent<SVGSVGElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      setScreenPoint({ xPx: event.clientX - bounds.left, yPx: event.clientY - bounds.top });
    },
    handlePointerLeave: () => {
      setScreenPoint(undefined);
    },
  };
}
