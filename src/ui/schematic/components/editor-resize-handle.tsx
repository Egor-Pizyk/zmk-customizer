import { useRef } from 'react';
import type { KeyboardEvent, PointerEvent, RefObject } from 'react';

type EditorResizeHandleProps = {
  readonly onDraft: (widthPx: number) => void;
  readonly onCommit: (widthPx: number) => void;
  readonly onCancel: () => void;
};

type ResizeStart = {
  readonly pointerId: number;
  readonly xPx: number;
  readonly widthPx: number;
  readonly maxWidthPx: number;
};

export function EditorResizeHandle({ onDraft, onCommit, onCancel }: EditorResizeHandleProps) {
  const pointer = useResizePointer({ onDraft, onCommit, onCancel });

  return (
    <button
      type="button"
      aria-label="Resize editors, use left and right arrow keys"
      aria-controls="schematic-editor-content"
      className="absolute inset-y-0 left-0 z-10 hidden w-6 cursor-ew-resize touch-none border-l border-border-strong hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus xl:block"
      onPointerDown={pointer.handlePointerDown}
      onPointerMove={pointer.handlePointerMove}
      onPointerUp={pointer.handlePointerUp}
      onPointerCancel={pointer.handleCancel}
      onLostPointerCapture={pointer.handleCancel}
      onKeyDown={(event) => {
        handleResizeKey(event, { onDraft, onCommit, onCancel }, pointer.handleCancel);
      }}
      onDoubleClick={() => {
        onCommit(448);
      }}
    />
  );
}

function getMaximumWidth(handle: HTMLButtonElement): number {
  const areaWidth = handle.parentElement?.parentElement?.getBoundingClientRect().width ?? 1440;
  return Math.min(640, areaWidth * 0.45);
}

function clampWidth({
  widthPx,
  maxWidthPx,
}: {
  readonly widthPx: number;
  readonly maxWidthPx: number;
}): number {
  return Math.max(320, Math.min(Math.round(widthPx), maxWidthPx));
}

function useResizePointer({ onDraft, onCommit, onCancel }: EditorResizeHandleProps) {
  const startRef = useRef<ResizeStart | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return;
    }
    const panel = event.currentTarget.parentElement;
    startRef.current = {
      pointerId: event.pointerId,
      xPx: event.clientX,
      widthPx: panel?.getBoundingClientRect().width ?? 448,
      maxWidthPx: getMaximumWidth(event.currentTarget),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    event.preventDefault();
  }

  function handleCancel() {
    if (startRef.current === null) {
      return;
    }
    startRef.current = null;
    onCancel();
  }

  const movement = useResizeMovement(startRef, { onDraft, onCommit, onCancel }, () => {
    startRef.current = null;
  });
  return { handlePointerDown, handleCancel, ...movement };
}

function useResizeMovement(
  startRef: RefObject<ResizeStart | null>,
  { onDraft, onCommit }: EditorResizeHandleProps,
  onFinish: () => void,
) {
  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const start = startRef.current;
    if (start === null || event.pointerId !== start.pointerId) {
      return;
    }
    onDraft(
      clampWidth({
        widthPx: start.widthPx + start.xPx - event.clientX,
        maxWidthPx: start.maxWidthPx,
      }),
    );
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const start = startRef.current;
    if (start === null || event.pointerId !== start.pointerId) {
      return;
    }
    onFinish();
    onCommit(
      clampWidth({
        widthPx: start.widthPx + start.xPx - event.clientX,
        maxWidthPx: start.maxWidthPx,
      }),
    );
  }

  return { handlePointerMove, handlePointerUp };
}

function handleResizeKey(
  event: KeyboardEvent<HTMLButtonElement>,
  { onCommit }: EditorResizeHandleProps,
  onCancel: () => void,
) {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    onCancel();
    return;
  }
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    return;
  }
  event.preventDefault();
  const maximum = getMaximumWidth(event.currentTarget);
  const width = event.currentTarget.parentElement?.getBoundingClientRect().width ?? 448;
  const step = event.shiftKey ? 64 : 16;
  const widths: Readonly<Record<string, number>> = {
    Home: 320,
    End: maximum,
    ArrowLeft: width + step,
    ArrowRight: width - step,
  };

  onCommit(clampWidth({ widthPx: widths[event.key] ?? width, maxWidthPx: maximum }));
}
