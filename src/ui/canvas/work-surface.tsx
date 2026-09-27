import { useRef, useState } from 'react';
import type { PointerEvent, ReactNode, RefObject } from 'react';
import type { CanvasWorkspaceId, Viewport } from '../../storage/preferences';
import { usePreferences } from '../preferences-context';
import { getWorkspaceLabel } from '../workspaces';
import { GridPattern } from './grid-pattern';
import { SurfaceOverlays } from './surface-overlays';
import { snapToGrid } from './snap';
import { StatusBar } from './status-bar';
import { useSurfaceViewport } from './use-surface-viewport';
import { screenToWorld } from './viewport';
import type { ScreenPoint } from './viewport';

type WorkSurfaceProps = {
  readonly workspaceId: CanvasWorkspaceId;
  /** Overlays inside the surface: tool window, minimap. */
  readonly children?: ReactNode;
};

export function WorkSurface({ workspaceId, children }: WorkSurfaceProps) {
  const { gridSizeU, isSnapEnabled } = usePreferences().preferences;
  const svgRef = useRef<SVGSVGElement>(null);
  const surface = useSurfaceViewport(workspaceId, svgRef);
  const { viewport } = surface;
  const pointer = usePointerReadout(viewport, isSnapEnabled ? gridSizeU : undefined);

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    surface.drag.handlePointerMove(event);
    pointer.handlePointerMove(event);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <SurfaceSvg
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

type SurfaceSvgProps = {
  readonly workspaceId: CanvasWorkspaceId;
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly viewport: Viewport;
  readonly drag: ReturnType<typeof useSurfaceViewport>['drag'];
  readonly onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
  readonly onPointerLeave: () => void;
};

// The canvas itself is the tab stop; canvas shortcuts apply while it has focus (R9).
function SurfaceSvg(props: SurfaceSvgProps) {
  const { workspaceId, svgRef, viewport, drag, onPointerMove, onPointerLeave } = props;
  const { gridSizeU, isGridVisible } = usePreferences().preferences;

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    onPointerMove(event);
  }

  function handlePointerLeave() {
    onPointerLeave();
  }

  return (
    <svg
      aria-label={`${getWorkspaceLabel(workspaceId)} canvas`}
      className="size-full touch-none bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      data-canvas-workspace={workspaceId}
      onPointerDown={drag.handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onLostPointerCapture={drag.handlePointerEnd}
      onPointerCancel={drag.handlePointerEnd}
      onPointerUp={drag.handlePointerEnd}
      ref={svgRef}
      role="application"
      tabIndex={0}
    >
      <GridPattern gridSizeU={gridSizeU} isVisible={isGridVisible} viewport={viewport} />
    </svg>
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
