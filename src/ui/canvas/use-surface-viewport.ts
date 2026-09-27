import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { PointerEvent, RefObject } from 'react';
import type { CanvasWorkspaceId, Viewport } from '../../storage/preferences';
import { usePreferences } from '../preferences-context';
import type { PreferencesChange } from '../preferences-context';
import { zoomAt } from './viewport';
import type { ScreenPoint } from './viewport';

const WHEEL_COMMIT_DELAY_MS = 200;
const WHEEL_ZOOM_STEP = 1.1;
const MIDDLE_BUTTON = 1;

// A draft remembers the stored viewport it started from. When the stored value changes from
// outside (shortcut, button, minimap click), the draft no longer matches and is ignored, so a
// stale gesture can never overwrite a newer view (research R15).
type Draft = {
  readonly base: Viewport;
  readonly viewport: Viewport;
};

// Preferences hold the view; a gesture renders a local draft and commits it at the end, so the
// shell does not re-render at 60 Hz.
export function useSurfaceViewport(
  workspaceId: CanvasWorkspaceId,
  svgRef: RefObject<SVGSVGElement | null>,
) {
  const { viewport, control } = useViewportControl(workspaceId);
  useWheelGestures(svgRef, control);
  const drag = useMiddleButtonPan(control);
  return {
    viewport,
    handleViewportCommit: control.commit,
    handleViewportDraft: control.draft,
    handleViewportFlush: control.flush,
    drag,
  };
}

type ViewChangeOptions = {
  readonly workspaceId: CanvasWorkspaceId;
  readonly next: Viewport;
  /** When set, the write is skipped if the stored view changed since the draft began. */
  readonly base?: Viewport | undefined;
};

function viewChange({ workspaceId, next, base }: ViewChangeOptions): PreferencesChange {
  return (latest) =>
    base === undefined || latest.viewByWorkspace[workspaceId] === base
      ? { viewByWorkspace: { ...latest.viewByWorkspace, [workspaceId]: next } }
      : {};
}

function useViewportControl(workspaceId: CanvasWorkspaceId) {
  const { preferences, changePreferences } = usePreferences();
  const stored = preferences.viewByWorkspace[workspaceId];
  const [draft, setDraft] = useState<Draft | undefined>();
  const draftRef = useRef<Draft | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function settle(write: Viewport | undefined, base?: Viewport) {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    draftRef.current = null;
    setDraft(undefined);
    if (write !== undefined) {
      changePreferences(viewChange({ workspaceId, next: write, base }));
    }
  }

  const control: ViewportControl = {
    current: () => (draftRef.current?.base === stored ? draftRef.current.viewport : stored),
    draft: (next) => {
      const base = draftRef.current?.base === stored ? draftRef.current.base : stored;
      draftRef.current = { base, viewport: next };
      setDraft(draftRef.current);
    },
    flush: () => {
      const pending = draftRef.current;
      settle(pending?.viewport, pending?.base);
    },
    flushLater: (delayMs) => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(control.flush, delayMs);
    },
    commit: (next) => {
      settle(next);
    },
  };
  return { viewport: draft?.base === stored ? draft.viewport : stored, control };
}

type ViewportControl = {
  /** The latest view, including a draft newer than the last render. */
  readonly current: () => Viewport;
  readonly draft: (viewport: Viewport) => void;
  /** Commits the pending draft, if it still applies. */
  readonly flush: () => void;
  readonly flushLater: (delayMs: number) => void;
  /** Discrete action: writes directly and drops any draft. */
  readonly commit: (viewport: Viewport) => void;
};

function localPoint(event: MouseEvent, element: Element): ScreenPoint {
  const bounds = element.getBoundingClientRect();
  return { xPx: event.clientX - bounds.left, yPx: event.clientY - bounds.top };
}

// Ctrl/Cmd+wheel zooms around the pointer, plain wheel pans.
function nextViewportForWheel(viewport: Viewport, event: WheelEvent, svg: Element): Viewport {
  if (event.ctrlKey || event.metaKey) {
    const factor = event.deltaY < 0 ? WHEEL_ZOOM_STEP : 1 / WHEEL_ZOOM_STEP;
    return zoomAt(viewport, factor, localPoint(event, svg));
  }
  return {
    ...viewport,
    panXPx: viewport.panXPx - event.deltaX,
    panYPx: viewport.panYPx - event.deltaY,
  };
}

// The draft commits 200 ms after the last wheel event, and on unmount (workspace switch).
function useWheelGestures(svgRef: RefObject<SVGSVGElement | null>, control: ViewportControl) {
  const handleWheel = useEffectEvent((event: WheelEvent, svg: SVGSVGElement) => {
    event.preventDefault();
    control.draft(nextViewportForWheel(control.current(), event, svg));
    control.flushLater(WHEEL_COMMIT_DELAY_MS);
  });
  const handleUnmount = useEffectEvent(() => {
    control.flush();
  });

  useEffect(() => {
    const svg = svgRef.current;
    function handleNativeWheel(event: WheelEvent) {
      if (svg !== null) {
        handleWheel(event, svg);
      }
    }
    // Non-passive so Ctrl/Cmd+wheel can cancel the browser's page zoom.
    svg?.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      svg?.removeEventListener('wheel', handleNativeWheel);
      handleUnmount();
    };
  }, [svgRef]);
}

type PanStart = {
  readonly pointer: ScreenPoint;
  readonly viewport: Viewport;
};

function useMiddleButtonPan(control: ViewportControl) {
  const startRef = useRef<PanStart | null>(null);

  function endPan() {
    if (startRef.current !== null) {
      startRef.current = null;
      control.flush();
    }
  }

  return {
    handlePointerDown: (event: PointerEvent<SVGSVGElement>) => {
      if (event.button === MIDDLE_BUTTON) {
        event.currentTarget.setPointerCapture(event.pointerId);
        const pointer = { xPx: event.clientX, yPx: event.clientY };
        startRef.current = { pointer, viewport: control.current() };
      }
    },
    handlePointerMove: (event: PointerEvent<SVGSVGElement>) => {
      const start = startRef.current;
      if (start !== null) {
        control.draft({
          ...start.viewport,
          panXPx: start.viewport.panXPx + event.clientX - start.pointer.xPx,
          panYPx: start.viewport.panYPx + event.clientY - start.pointer.yPx,
        });
      }
    },
    handlePointerEnd: endPan,
  };
}
