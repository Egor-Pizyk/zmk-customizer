import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode, RefObject } from 'react';
import { ChevronIcon } from './icons/chevron-icon';
import { IconButton } from './icon-button';
import { clampPanelPosition, panelPositionForKey } from './panel-position';
import type { PanelPosition, PanelSize } from './panel-position';

type FloatingPanelProps = {
  readonly title: string;
  readonly position: PanelPosition;
  readonly isCollapsed: boolean;
  readonly onMoveEnd: (position: PanelPosition) => void;
  readonly onCollapsedChange: (isCollapsed: boolean) => void;
  readonly children: ReactNode;
};

// Stored position + a local drag draft; the clamp is derived in render, never written back on
// resize (spec 001 R7, R15).
export function FloatingPanel(props: FloatingPanelProps) {
  const { title, position, isCollapsed, onMoveEnd, onCollapsedChange, children } = props;
  const panelRef = useRef<HTMLElement>(null);
  const bodyId = useId();
  const sizes = usePanelSizes(panelRef);
  const drag = usePanelDrag(
    (next) => clampPanelPosition(next, sizes.panel, sizes.container),
    onMoveEnd,
  );
  const rendered = clampPanelPosition(drag.draft ?? position, sizes.panel, sizes.container);

  function handleCollapseClick() {
    onCollapsedChange(!isCollapsed);
  }

  return (
    <section
      aria-label={title}
      className="absolute top-0 left-0 z-10 w-44 rounded-lg border border-border bg-surface-raised"
      ref={panelRef}
      style={{ translate: `${rendered.xPx}px ${rendered.yPx}px` }}
    >
      <div className="flex items-center gap-1 border-b border-border p-1">
        <PanelHandle current={rendered} drag={drag} title={title} />
        <IconButton
          aria-controls={bodyId}
          aria-expanded={!isCollapsed}
          icon={<ChevronIcon />}
          label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
          onClick={handleCollapseClick}
        />
      </div>
      <div className="p-2" hidden={isCollapsed} id={bodyId}>
        {children}
      </div>
    </section>
  );
}

type PanelDrag = ReturnType<typeof usePanelDrag>;

type PanelHandleProps = {
  readonly title: string;
  readonly current: PanelPosition;
  readonly drag: PanelDrag;
};

// A real <button>, so its drag and arrow keys are allowed interactions (jsx-a11y).
function PanelHandle({ title, current, drag }: PanelHandleProps) {
  return (
    <button
      aria-label={`Move ${title.toLowerCase()} window, use arrow keys`}
      className="h-8 flex-1 cursor-move touch-none rounded-md px-2 text-left font-medium focus-visible:outline-2 focus-visible:outline-focus"
      onKeyDown={(event) => {
        drag.handleKeyDown(event, current);
      }}
      onPointerDown={(event) => {
        drag.handlePointerDown(event, current);
      }}
      onLostPointerCapture={drag.handlePointerEnd}
      onPointerCancel={drag.handlePointerEnd}
      onPointerMove={drag.handlePointerMove}
      onPointerUp={drag.handlePointerEnd}
      type="button"
    >
      {title}
    </button>
  );
}

const UNMEASURED: PanelSize = {
  widthPx: Number.POSITIVE_INFINITY,
  heightPx: Number.POSITIVE_INFINITY,
};

// Panel and container sizes come from the observer callback, not the effect body.
function usePanelSizes(panelRef: RefObject<HTMLElement | null>) {
  const [sizes, setSizes] = useState({ panel: { widthPx: 0, heightPx: 0 }, container: UNMEASURED });
  useEffect(() => {
    const panel = panelRef.current;
    const container = panel?.parentElement ?? undefined;
    const observer = new ResizeObserver(() => {
      if (panel !== null && container !== undefined) {
        setSizes({
          panel: { widthPx: panel.offsetWidth, heightPx: panel.offsetHeight },
          container: { widthPx: container.clientWidth, heightPx: container.clientHeight },
        });
      }
    });
    if (panel !== null && container !== undefined) {
      observer.observe(panel);
      observer.observe(container);
    }
    return () => {
      observer.disconnect();
    };
  }, [panelRef]);
  return sizes;
}

function usePanelDrag(
  clamp: (position: PanelPosition) => PanelPosition,
  onMoveEnd: (position: PanelPosition) => void,
) {
  const [draft, setDraft] = useState<PanelPosition | undefined>();
  const grabOffsetRef = useRef<PanelPosition>({ xPx: 0, yPx: 0 });

  return {
    draft,
    // Primary button only: a right-click opens the context menu and never sends pointerup.
    handlePointerDown: (event: PointerEvent<HTMLButtonElement>, current: PanelPosition) => {
      if (event.button !== 0) {
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      grabOffsetRef.current = {
        xPx: event.clientX - current.xPx,
        yPx: event.clientY - current.yPx,
      };
      setDraft(current);
    },
    handlePointerMove: (event: PointerEvent<HTMLButtonElement>) => {
      if (draft !== undefined) {
        const offset = grabOffsetRef.current;
        setDraft({ xPx: event.clientX - offset.xPx, yPx: event.clientY - offset.yPx });
      }
    },
    handlePointerEnd: () => {
      if (draft !== undefined) {
        onMoveEnd(clamp(draft));
        setDraft(undefined);
      }
    },
    handleKeyDown: (event: KeyboardEvent<HTMLButtonElement>, current: PanelPosition) => {
      const next = panelPositionForKey(current, event.key, event.shiftKey);
      if (next !== undefined) {
        event.preventDefault();
        onMoveEnd(clamp(next));
      }
    },
  };
}
