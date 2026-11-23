import { useRef } from 'react';
import type {
  SchematicPointerOptions,
  SchematicPointerHandler,
  SchematicPointerInput,
  Commit,
} from './pointer-types';
import type { DiagramGestureSession } from '@ui/schematic/diagram/logic';
import { useKeyTransformPointer } from './use-key-transform-pointer';
import { useSchematicPointer } from './use-schematic-pointer';

type EditingOptions = SchematicPointerOptions & {
  readonly getGestureSession: () => DiagramGestureSession;
  readonly projectRevision: number;
};
type EditingPointer = ReturnType<typeof useKeyTransformPointer>;

export function useEditingPointer(options: EditingOptions) {
  const capture = usePointerCapture();
  const guarded = { ...options, commit: createGestureCommit(options) };
  const pointer = useSchematicPointer(guarded);
  const editing = useKeyTransformPointer(pointer, guarded);
  return guardEditingPointer(editing, options, capture);
}

function createGestureCommit(options: EditingOptions): Commit {
  return (change, message) => {
    const token = options.getGestureSession().getToken();
    if (token === undefined) {
      return;
    }
    const guarded = options.getGestureSession().finish({
      token,
      project: options.project,
      pointerId: token.pointerId,
      isReadOnly: false,
      change,
    });
    if (guarded !== undefined) {
      options.commit(guarded, message);
    }
  };
}

function guardEditingPointer(
  pointer: EditingPointer,
  options: EditingOptions,
  capture: ReturnType<typeof usePointerCapture>,
) {
  const cancelDraft = () => {
    options.getGestureSession().cancel();
    pointer.cancelDraft();
    capture.release();
  };
  const onPointerDown = createPointerStart({ pointer, options, capture, cancelDraft });
  return {
    ...pointer,
    cancelDraft,
    surfaceHandlers: {
      ...pointer.surfaceHandlers,
      onPointerDown,
      onPointerCancel: cancelDraft,
      onPointerMove: guardPointerCompletion(pointer, options, { cancelDraft, phase: 'move' }),
      onPointerUp: guardPointerCompletion(pointer, options, { cancelDraft, phase: 'up' }),
    },
  };
}

function createPointerStart({
  pointer,
  options,
  capture,
  cancelDraft,
}: {
  readonly pointer: EditingPointer;
  readonly options: EditingOptions;
  readonly capture: ReturnType<typeof usePointerCapture>;
  readonly cancelDraft: () => void;
}): SchematicPointerHandler {
  return (world, event) => {
    const token = options.getGestureSession().getToken();
    if (
      pointer.hasDraft &&
      (token === undefined ||
        !options.getGestureSession().isCurrent({ project: options.project, token }))
    ) {
      cancelDraft();
      return;
    }
    if (
      pointer.hasDraft &&
      options.activeToolId !== 'wire' &&
      token?.pointerId !== event.pointerId
    ) {
      return;
    }
    if (!pointer.hasDraft || options.activeToolId === 'wire') {
      options.getGestureSession().start({
        project: options.project,
        pointerId: event.pointerId,
        isReadOnly: false,
      });
    }
    capture.set(event);
    pointer.surfaceHandlers.onPointerDown(world, event);
  };
}

function guardPointerCompletion(
  pointer: EditingPointer,
  options: EditingOptions,
  input: { readonly cancelDraft: () => void; readonly phase: 'move' | 'up' },
): SchematicPointerHandler {
  return (world, event) => {
    const token = options.getGestureSession().getToken();
    if (token !== undefined && event.pointerId !== token.pointerId) {
      return;
    }
    if (
      (token !== undefined &&
        !options.getGestureSession().isCurrent({ project: options.project, token })) ||
      (pointer.hasDraft && token === undefined)
    ) {
      input.cancelDraft();
      return;
    }
    if (input.phase === 'move') {
      pointer.surfaceHandlers.onPointerMove(world, event);
      return;
    }
    if (token === undefined) {
      return;
    }
    pointer.surfaceHandlers.onPointerUp(world, event);
    if (options.activeToolId !== 'wire') {
      options.getGestureSession().cancel();
    }
  };
}

function usePointerCapture() {
  const currentRef = useRef<SchematicPointerInput | null>(null);
  return {
    set: (input: SchematicPointerInput) => {
      currentRef.current = input;
    },
    release: () => {
      const captured = currentRef.current;
      currentRef.current = null;
      captured?.release();
    },
  };
}
