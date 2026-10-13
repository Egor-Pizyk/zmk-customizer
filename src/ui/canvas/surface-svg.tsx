import type { PointerEvent, RefObject } from 'react';
import type { CanvasWorkspaceId, Viewport } from '@storage/preferences';
import { usePreferences } from '@ui/preferences';
import { getWorkspaceLabel } from '@ui/navigation';
import { GridPattern } from './grid-pattern';
import { toContentView, toWorldPoint } from './surface-content';
import type { SurfaceContent } from './surface-content';
import type { useSurfaceViewport } from './use-surface-viewport';

export type SurfaceSvgProps = {
  readonly workspaceId: CanvasWorkspaceId;
  readonly svgRef: RefObject<SVGSVGElement | null>;
  readonly viewport: Viewport;
  readonly drag: ReturnType<typeof useSurfaceViewport>['drag'];
  readonly onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
  readonly onPointerLeave: () => void;
  readonly content: SurfaceContent | undefined;
};

const PRIMARY_BUTTON = 0;

function createPrimaryHandlers(input: {
  readonly content: SurfaceContent | undefined;
  readonly viewport: Viewport;
  readonly drag: SurfaceSvgProps['drag'];
}) {
  const { content, viewport, drag } = input;
  return {
    handlePointerDown: (event: PointerEvent<SVGSVGElement>) => {
      drag.handlePointerDown(event);
      if (event.button === PRIMARY_BUTTON) {
        content?.onPointerDown?.(toWorldPoint(event, viewport), event);
      }
    },
    handlePointerCancel: () => {
      drag.handlePointerEnd();
      content?.onPointerCancel?.();
    },
    handlePointerUp: (event: PointerEvent<SVGSVGElement>) => {
      drag.handlePointerEnd();
      if (event.button === PRIMARY_BUTTON) {
        content?.onPointerUp?.(toWorldPoint(event, viewport), event);
      }
    },
  };
}

// The canvas itself is the tab stop; canvas shortcuts apply while it has focus (R9).
export function SurfaceSvg(props: SurfaceSvgProps) {
  const { workspaceId, svgRef, viewport, drag, onPointerMove, onPointerLeave, content } = props;
  const { gridSizeU, isGridVisible } = usePreferences().preferences;
  const primary = createPrimaryHandlers({ content, viewport, drag });
  const view = toContentView(viewport);

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    onPointerMove(event);
  }

  function handlePointerLeave() {
    onPointerLeave();
    content?.onPointerLeave?.();
  }

  return (
    <svg
      aria-label={content?.label ?? `${getWorkspaceLabel(workspaceId)} canvas`}
      className="size-full touch-none bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      data-canvas-workspace={workspaceId}
      onPointerDown={primary.handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onLostPointerCapture={primary.handlePointerCancel}
      onPointerCancel={primary.handlePointerCancel}
      onPointerUp={primary.handlePointerUp}
      ref={svgRef}
      role="application"
      tabIndex={0}
    >
      <GridPattern gridSizeU={gridSizeU} isVisible={isGridVisible} viewport={viewport} />
      {content === undefined ? undefined : (
        <g transform={`translate(${viewport.panXPx} ${viewport.panYPx}) scale(${view.pxPerU})`}>
          {content.render(view)}
        </g>
      )}
      {content?.renderScreen?.(view)}
    </svg>
  );
}
