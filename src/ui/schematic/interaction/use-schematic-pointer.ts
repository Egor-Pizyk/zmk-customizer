import { useRef, useState } from 'react';
import type { Project, WirePoint } from '@domain';
import { getHoverPreview } from './get-hover-preview';
import type { Hover } from './get-hover-preview';
import { getPreviewProject } from './pointer-preview';
import { clickWireTool } from './pointer-create';
import { placeKeyAt, placeEncoderAt } from './place-key-at';
import {
  doubleClickSelectTool,
  endSelectDrag,
  moveSelectDrag,
  pressSelectTool,
} from './pointer-select';
import type {
  Drag,
  PointerState,
  SchematicPointerOptions,
  SchematicPointerInput,
} from './pointer-types';
import type { CanvasHit } from './read-canvas-hit';
import type { WireDraft } from './reduce-wire-draft';

function handlePress(state: PointerState, world: WirePoint, event: SchematicPointerInput) {
  const hit = event.hit;
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
  const [drag, setDrag] = usePointerDraft<Drag>(options.project, options.projectRevision ?? 0);
  const [draft, setDraft] = usePointerDraft<WireDraft>(
    options.project,
    options.projectRevision ?? 0,
  );
  const [hover, setHover] = useState<Hover | undefined>();
  const wirePressHistory = useWirePressHistory(options);
  const state: PointerState = {
    ...options,
    drag,
    onDragChange: setDrag,
    draft,
    onDraftChange: setDraft,
  };
  const { activeToolId, snapGridU } = options;
  const handlers = createHandlers(state, setHover, wirePressHistory);
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
      wirePressHistory.setLastWirePress(undefined);
      setDraft(undefined);
      setDrag(undefined);
    },
  };
}

type LastWirePress = {
  readonly wireId: string;
  readonly timeMs: number;
  readonly point: WirePoint;
};

// Event history must be synchronous even when React batches two native presses.
function useWirePressHistory(options: SchematicPointerOptions) {
  const lastWirePress = useRef<{ base: Project; revision: number; press: LastWirePress } | null>(
    null,
  );
  return {
    getLastWirePress: () =>
      lastWirePress.current?.base === options.project &&
      lastWirePress.current.revision === (options.projectRevision ?? 0)
        ? lastWirePress.current.press
        : undefined,
    setLastWirePress: (press: LastWirePress | undefined) => {
      lastWirePress.current =
        press === undefined
          ? null
          : { base: options.project, revision: options.projectRevision ?? 0, press };
    },
  };
}

function createHandlers(
  state: PointerState,
  setHover: (hover?: Hover) => void,
  doublePress: ReturnType<typeof useWirePressHistory>,
) {
  return {
    handlePointerDown: (world: WirePoint, event: SchematicPointerInput) => {
      handlePointerDown(state, doublePress, [world, event]);
    },
    handlePointerMove: (world: WirePoint, event: SchematicPointerInput) => {
      moveSelectDrag(state, world, event);
      if (state.activeToolId !== 'select') {
        setHover({ world, hit: event.hit });
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

function handlePointerDown(
  state: PointerState,
  doublePress: Parameters<typeof createHandlers>[2],
  [world, event]: readonly [WirePoint, SchematicPointerInput],
) {
  const hit = event.hit;
  const handled = handleDoubleWirePress(state, {
    lastWirePress: doublePress.getLastWirePress(),
    setLastWirePress: doublePress.setLastWirePress,
    hit,
    world,
    timeMs: event.timeStamp,
    shiftKey: event.shiftKey,
  });
  if (!handled) {
    handlePress(state, world, event);
  }
}

function handleDoubleWirePress(
  state: PointerState,
  input: {
    readonly hit: CanvasHit;
    readonly world: WirePoint;
    readonly timeMs: number;
    readonly shiftKey: boolean;
    readonly lastWirePress: LastWirePress | undefined;
    readonly setLastWirePress: (press: LastWirePress | undefined) => void;
  },
): boolean {
  const wireId =
    input.hit.kind === 'section' || input.hit.kind === 'wire' ? input.hit.wireId : undefined;
  const isDouble =
    state.activeToolId === 'select' &&
    wireId !== undefined &&
    !input.shiftKey &&
    input.lastWirePress?.wireId === wireId &&
    Math.hypot(
      input.world.xU - input.lastWirePress.point.xU,
      input.world.yU - input.lastWirePress.point.yU,
    ) <= 0.1 &&
    input.timeMs - input.lastWirePress.timeMs <= 500;
  input.setLastWirePress(
    isDouble || state.activeToolId !== 'select' || wireId === undefined
      ? undefined
      : { wireId, timeMs: input.timeMs, point: input.world },
  );
  if (isDouble) {
    state.onHintClear();
    doubleClickSelectTool(state, { hit: input.hit, world: input.world });
  }
  return isDouble;
}

function usePointerDraft<Value>(project: Project, revision: number) {
  const [draft, setDraft] = useState<{
    readonly base: Project;
    readonly revision: number;
    readonly value: Value;
  }>();
  const current = draft?.base === project && draft.revision === revision ? draft.value : undefined;
  const change = (value: Value | undefined) => {
    setDraft(value === undefined ? undefined : { base: project, revision, value });
  };
  return [current, change] as const;
}
