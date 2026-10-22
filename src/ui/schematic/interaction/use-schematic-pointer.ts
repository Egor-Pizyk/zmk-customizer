import { useState } from 'react';
import type { PointerEvent } from 'react';
import type { WirePoint } from '@domain';
import { getHoverPreview } from './get-hover-preview';
import type { Hover } from './get-hover-preview';
import { getPreviewProject } from './pointer-preview';
import { clickWireTool } from './pointer-create';
import { placeKeyAt, placeEncoderAt } from './place-key-at';
import { endSelectDrag, moveSelectDrag, pressSelectTool } from './pointer-select';
import type { Drag, PointerState, SchematicPointerOptions } from './pointer-types';
import { readCanvasHit } from './read-canvas-hit';
import type { WireDraft } from './reduce-wire-draft';

function handlePress(state: PointerState, world: WirePoint, event: PointerEvent<SVGSVGElement>) {
  const hit = readCanvasHit(event.target);
  if (hit.kind === 'control') {
    return;
  }
  state.onHintClear();
  if (state.activeToolId === 'add-encoder') {
    placeEncoderAt(state, world);
  }
  if (state.activeToolId === 'add-key') {
    placeKeyAt(state, world);
  }
  if (state.activeToolId === 'wire') {
    clickWireTool(state, { hit, world, timeMs: event.timeStamp });
  }
  if (state.activeToolId === 'select') {
    pressSelectTool(state, { hit, world, event });
  }
}

// Tool-specific pointer handling (003 R9). Drags keep a local preview and commit once on
// pointer-up, so one gesture is one undo step (react.md).
export function useSchematicPointer(options: SchematicPointerOptions) {
  const [drag, setDrag] = useState<Drag | undefined>();
  const [draft, setDraft] = useState<WireDraft | undefined>();
  const [hover, setHover] = useState<Hover | undefined>();
  const state: PointerState = {
    ...options,
    drag,
    onDragChange: setDrag,
    draft,
    onDraftChange: setDraft,
  };
  const { activeToolId, snapGridU } = options;
  const handlers = createHandlers(state, setHover);
  return {
    ...handlers,
    drag,
    // Spread onto SchematicCanvas as its pointer props.
    surfaceHandlers: {
      onPointerDown: handlers.handlePointerDown,
      onPointerMove: handlers.handlePointerMove,
      onPointerUp: handlers.handlePointerUp,
      onPointerCancel: handlers.handlePointerCancel,
      onPointerLeave: handlers.handlePointerLeave,
    },
    previewProject: getPreviewProject(options.project, drag),
    hoverPreview: getHoverPreview(options.project, { activeToolId, hover, snapGridU, draft }),
    hasDraft: draft !== undefined || drag !== undefined,
    cancelDraft: () => {
      setDraft(undefined);
      setDrag(undefined);
    },
  };
}

function createHandlers(state: PointerState, setHover: (hover?: Hover) => void) {
  return {
    handlePointerDown: (world: WirePoint, event: PointerEvent<SVGSVGElement>) => {
      handlePress(state, world, event);
    },
    handlePointerMove: (world: WirePoint, event: PointerEvent<SVGSVGElement>) => {
      moveSelectDrag(state, world);
      // Hover only matters for tools that preview; Select would re-render on every move for nothing.
      if (state.activeToolId !== 'select') {
        setHover({ world, hit: readCanvasHit(event.target) });
      }
    },
    handlePointerUp: () => {
      endSelectDrag(state);
    },
    handlePointerCancel: () => {
      state.onDragChange();
    },
    handlePointerLeave: () => {
      setHover();
    },
  };
}
