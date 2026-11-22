import type { PointerEvent, RefObject } from 'react';
import type { CanvasWorkspaceId, Viewport } from '@storage/preferences';
import { usePreferences } from '@ui/preferences';
import { toContentView, toWorldPoint } from '@ui/canvas/logic';
import type { SurfaceContent, useSurfaceViewport } from '@ui/canvas/logic';
import { GridPattern } from './grid-pattern';

type SurfaceHostProps = {
  readonly content: Extract<SurfaceContent, { readonly kind: 'host' }>;
  readonly hostRef: RefObject<HTMLDivElement | null>;
  readonly viewport: Viewport;
  readonly workspaceId: CanvasWorkspaceId;
  readonly drag: ReturnType<typeof useSurfaceViewport>['drag'];
  readonly onPointerMove: (event: PointerEvent) => void;
  readonly onPointerLeave: () => void;
};

// The shared surface owns camera/grid/pan; the external renderer owns only its host subtree.
export function SurfaceHost(input: SurfaceHostProps) {
  const { content, hostRef, viewport, workspaceId } = input;
  const { gridSizeU, isGridVisible } = usePreferences().preferences;
  const view = toContentView(viewport);
  const handlers = createHostHandlers(input);
  return (
    <div
      aria-label={content.label}
      className="relative size-full touch-none bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      data-canvas-workspace={workspaceId}
      onPointerDown={handlers.handlePointerDown}
      onPointerMove={handlers.handlePointerMove}
      onPointerUp={handlers.handlePointerUp}
      onPointerCancel={handlers.handlePointerCancel}
      onLostPointerCapture={handlers.handlePointerCancel}
      onPointerLeave={handlers.handlePointerLeave}
      ref={hostRef}
      role="application"
      tabIndex={0}
    >
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full">
        <GridPattern gridSizeU={gridSizeU} isVisible={isGridVisible} viewport={viewport} />
      </svg>
      {content.renderHost(view)}
      <svg className="pointer-events-none absolute inset-0 size-full **:data-wire-bend:pointer-events-auto [&_foreignObject]:pointer-events-auto">
        {content.renderScreen?.(view)}
      </svg>
    </div>
  );
}

function createHostHandlers(input: SurfaceHostProps) {
  const { content, viewport, drag, onPointerMove, onPointerLeave } = input;
  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    drag.handlePointerDown(event);
    if (event.button === 0) {
      content.onPointerDown?.(toWorldPoint(event, viewport), event);
    }
  }
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    onPointerMove(event);
    content.onPointerMove?.(toWorldPoint(event, viewport), event);
  }
  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    drag.handlePointerEnd();
    if (event.button === 0) {
      content.onPointerUp?.(toWorldPoint(event, viewport), event);
    }
  }
  function handlePointerCancel() {
    drag.handlePointerEnd();
    content.onPointerCancel?.();
  }
  function handlePointerLeave() {
    onPointerLeave();
    content.onPointerLeave?.();
  }
  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
  };
}
