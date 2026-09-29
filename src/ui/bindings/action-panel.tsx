import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { usePreferences } from '../preferences-context';
import type { PickHandlers } from './create-pick-handlers';
import {
  ACTION_PANEL_DEFAULT_WIDTH_PX,
  actionPanelWidthForKey,
  clampActionPanelWidth,
} from './action-panel-width';
import { BehaviorSection } from './behavior-section';
import { KeyOptions } from './key-options';
import { KeyPicker } from './key-picker';
import { PanelHeader } from './panel-header';
import { PickerPreview } from './picker-preview';
import type { KeyPickerState } from './use-key-picker';

type ActionPanelProps = {
  readonly picker: KeyPickerState;
  readonly handlers: PickHandlers;
  readonly selectionName: string;
  readonly selectedCount: number;
  readonly isKeyPress: boolean;
  readonly canPaste: boolean;
  readonly onCopy: () => void;
  readonly onPaste: () => void;
  readonly onEscapeToCanvas: () => void;
};

const OPEN_PANEL_CLASSES =
  'relative flex min-h-0 shrink-0 flex-col border-l border-border bg-surface-raised';
const COLLAPSED_PANEL_CLASSES =
  'flex min-h-0 w-12 shrink-0 flex-col items-center border-l border-border bg-surface-raised';

// Docked on the right at full height, collapsible and resizable by its left edge
// (spec 004 FR-008, R14).
export function ActionPanel(props: ActionPanelProps) {
  const { preferences, changePreferences } = usePreferences();
  const { isBindingsPanelOpen: isOpen, actionPanelWidthPx: storedWidthPx } = preferences;
  const headingId = useId();
  const bodyId = useId();
  const resize = usePanelResize(storedWidthPx, (widthPx) => {
    changePreferences({ actionPanelWidthPx: widthPx });
  });
  const panelClassName = isOpen ? OPEN_PANEL_CLASSES : COLLAPSED_PANEL_CLASSES;

  function handleToggle() {
    changePreferences({ isBindingsPanelOpen: !isOpen });
  }

  return (
    <aside
      aria-labelledby={headingId}
      className={panelClassName}
      data-action-panel
      style={isOpen ? { width: resize.widthPx } : undefined}
    >
      {isOpen ? (
        <ResizeHandle
          onResize={resize.handleDraft}
          onResizeCancel={resize.handleCancel}
          onResizeCommit={resize.handleCommit}
          widthPx={resize.widthPx}
        />
      ) : undefined}
      <PanelHeader bodyId={bodyId} headingId={headingId} isOpen={isOpen} onToggle={handleToggle} />
      <div
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto overscroll-contain p-4"
        hidden={!isOpen}
        id={bodyId}
      >
        <ActionPanelBody {...props} />
      </div>
    </aside>
  );
}

// Stored width + a local drag draft; the clamp is derived in render and committed once the
// drag ends, so preferences write once per resize (react.md "Project state").
function usePanelResize(storedWidthPx: number, onCommit: (widthPx: number) => void) {
  const [draftWidthPx, setDraftWidthPx] = useState<number | undefined>();

  function handleDraft(widthPx: number) {
    setDraftWidthPx(widthPx);
  }

  function handleCommit(widthPx: number) {
    setDraftWidthPx(undefined);
    onCommit(clampActionPanelWidth(widthPx));
  }

  function handleCancel() {
    setDraftWidthPx(undefined);
  }

  const widthPx = clampActionPanelWidth(draftWidthPx ?? storedWidthPx);
  return { widthPx, handleDraft, handleCommit, handleCancel };
}

type ResizeHandleProps = {
  readonly widthPx: number;
  readonly onResize: (widthPx: number) => void;
  readonly onResizeCommit: (widthPx: number) => void;
  readonly onResizeCancel: () => void;
};

// A real <button>, so its drag and arrow keys are allowed interactions (jsx-a11y). Dragging
// the left edge resizes; arrows do the same from the keyboard (accessibility.md).
function ResizeHandle(props: ResizeHandleProps) {
  const {
    handleDoubleClick,
    handleKeyDown,
    handlePointerCancel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useResizeDrag(props);

  return (
    <button
      aria-label="Resize action panel, use left and right arrow keys"
      className="group absolute inset-y-0 left-0 w-3 -translate-x-1/2 cursor-ew-resize touch-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onLostPointerCapture={handlePointerCancel}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      type="button"
    >
      <span
        aria-hidden="true"
        className="mx-auto block h-full w-px bg-border group-hover:bg-accent group-focus-visible:bg-accent"
      />
    </button>
  );
}

// Pointer drag keeps its start in a ref and commits once; keyboard and double-click commit
// directly. Cancel reverts to the stored width.
function useResizeDrag(props: ResizeHandleProps) {
  const { widthPx, onResizeCommit } = props;
  const pointer = useResizePointer(props);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const next = actionPanelWidthForKey(widthPx, event.key, event.shiftKey);
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    onResizeCommit(next);
  }

  function handleDoubleClick() {
    onResizeCommit(ACTION_PANEL_DEFAULT_WIDTH_PX);
  }

  return { ...pointer, handleKeyDown, handleDoubleClick };
}

function useResizePointer({
  widthPx,
  onResize,
  onResizeCommit,
  onResizeCancel,
}: ResizeHandleProps) {
  const startRef = useRef({ xPx: 0, widthPx: 0 });
  const [isDragging, setIsDragging] = useState(false);

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    startRef.current = { xPx: event.clientX, widthPx };
    setIsDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!isDragging) {
      return;
    }
    const start = startRef.current;
    onResize(clampActionPanelWidth(start.widthPx + (start.xPx - event.clientX)));
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (!isDragging) {
      return;
    }
    setIsDragging(false);
    const start = startRef.current;
    onResizeCommit(clampActionPanelWidth(start.widthPx + (start.xPx - event.clientX)));
  }

  function handlePointerCancel() {
    if (!isDragging) {
      return;
    }
    setIsDragging(false);
    onResizeCancel();
  }

  return { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel };
}

// Escape anywhere in the panel (mini keyboard, chips, hold, mode) returns focus
// to the active keycap (FR-025). The search field focuses it directly too;
// focusing twice is harmless.
function usePanelEscape(onEscapeToCanvas: () => void) {
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      const target = event.target instanceof Element ? event.target : undefined;
      if (event.key === 'Escape' && target?.closest('[data-action-panel]') !== null) {
        onEscapeToCanvas();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEscapeToCanvas]);
}

function ActionPanelBody(props: ActionPanelProps) {
  const { picker, handlers, selectedCount, onEscapeToCanvas } = props;
  const { preferences, changePreferences } = usePreferences();
  usePanelEscape(onEscapeToCanvas);

  function handleAutoAdvanceChange(isAutoAdvanceEnabled: boolean) {
    changePreferences({ isAutoAdvanceEnabled });
  }

  if (selectedCount === 0) {
    return <p className="text-text-muted">Select a keycap to choose what it does.</p>;
  }
  return (
    <>
      <BehaviorSection
        onPick={handlers.handlePick}
        onShowTab={picker.handleTabChange}
        shared={picker.shared}
      />
      <PickerPreview {...props} shared={picker.shared} />
      <KeyPicker
        onEscapeToCanvas={props.onEscapeToCanvas}
        onPick={handlers.handlePick}
        picker={picker}
      />
      <KeyOptions
        isAutoAdvanceEnabled={preferences.isAutoAdvanceEnabled}
        isKeyPress={props.isKeyPress}
        onAutoAdvanceChange={handleAutoAdvanceChange}
        onHoldChange={handlers.handleHoldChange}
        onModeChange={handlers.handleModeChange}
        onModifierToggle={handlers.handleModifierToggle}
        pendingModifiers={picker.pendingModifiers}
        shared={picker.shared}
      />
    </>
  );
}
