import type { ContentPointerHandler } from '@ui/canvas';
import { useState } from 'react';
import { transformKeyFromPointer } from '@domain';
import type { KeyPointerTransform, Project } from '@domain';
import { getSelectedKeyIds } from './get-selected-key-ids';
import type { SchematicPointerOptions } from './pointer-types';
import { readTransformTarget } from './read-transform-target';
import type { useSchematicPointer } from './use-schematic-pointer';

type Pointer = ReturnType<typeof useSchematicPointer>;
type TransformHandlers = Omit<Pointer['surfaceHandlers'], 'onPointerUp'> & {
  readonly onPointerUp: ContentPointerHandler;
};
type EditingPointer = Omit<Pointer, 'surfaceHandlers'> & {
  readonly surfaceHandlers: TransformHandlers;
};
type Draft = {
  readonly base: Project;
  readonly selectionKey: string;
  readonly pointerId: number;
  readonly gesture: KeyPointerTransform;
};

export function useKeyTransformPointer(
  pointer: Pointer,
  options: SchematicPointerOptions,
): EditingPointer {
  const [draft, setDraft] = useState<Draft | undefined>();
  const selectionKey = getSelectedKeyIds(options.selection).join(',');
  const current =
    draft?.base === options.project &&
    draft.selectionKey === selectionKey &&
    options.activeToolId === 'select'
      ? draft
      : undefined;
  if (draft !== undefined && current === undefined) {
    setDraft(undefined);
  }
  const handlers = createTransformHandlers(pointer, options, { current, selectionKey, setDraft });
  return {
    ...pointer,
    hasDraft: pointer.hasDraft || current !== undefined,
    previewProject:
      current === undefined
        ? pointer.previewProject
        : transformKeyFromPointer(current.base, { gesture: current.gesture, phase: 'preview' }),
    surfaceHandlers: { ...pointer.surfaceHandlers, ...handlers },
    cancelDraft: () => {
      setDraft(undefined);
      pointer.cancelDraft();
    },
  };
}

type DraftHandlers = {
  readonly current: Draft | undefined;
  readonly selectionKey: string;
  readonly setDraft: (draft: Draft | undefined) => void;
};

function createTransformHandlers(
  pointer: Pointer,
  options: SchematicPointerOptions,
  state: DraftHandlers,
): TransformHandlers {
  return {
    ...pointer.surfaceHandlers,
    onPointerDown: (world, event) => {
      startTransform({ pointer, options, state }, [world, event]);
    },
    onPointerMove: (world, event) => {
      moveTransform({ pointer, options, state }, [world, event]);
    },
    onPointerUp: (_world, event) => {
      if (state.current === undefined) {
        pointer.surfaceHandlers.onPointerUp();
        return;
      }
      if (event.pointerId !== state.current.pointerId) {
        return;
      }
      finishTransform(options, state);
    },
    onPointerCancel: () => {
      state.setDraft(undefined);
      pointer.surfaceHandlers.onPointerCancel();
    },
  };
}

function startTransform(
  {
    pointer,
    options,
    state,
  }: {
    readonly pointer: Pointer;
    readonly options: SchematicPointerOptions;
    readonly state: DraftHandlers;
  },
  [world, event]: Parameters<ContentPointerHandler>,
) {
  const gesture =
    options.activeToolId === 'select' ? readTransformTarget(event.target, world) : undefined;
  if (gesture === undefined) {
    pointer.surfaceHandlers.onPointerDown(world, event);
    return;
  }
  pointer.cancelDraft();
  options.onHintClear();
  event.currentTarget.setPointerCapture(event.pointerId);
  state.setDraft({
    base: options.project,
    selectionKey: state.selectionKey,
    pointerId: event.pointerId,
    gesture,
  });
}
function moveTransform(
  {
    pointer,
    options,
    state,
  }: {
    readonly pointer: Pointer;
    readonly options: SchematicPointerOptions;
    readonly state: DraftHandlers;
  },
  [world, event]: Parameters<ContentPointerHandler>,
) {
  if (state.current === undefined) {
    pointer.surfaceHandlers.onPointerMove(world, event);
    return;
  }
  if (event.pointerId !== state.current.pointerId) {
    return;
  }
  const gesture = state.current.gesture;
  const next =
    gesture.kind === 'resize'
      ? {
          ...gesture,
          position: world,
          ...(options.snapGridU === undefined ? {} : { snapGridU: options.snapGridU }),
        }
      : { ...gesture, position: world, isAngleSnapEnabled: event.shiftKey };
  state.setDraft({ ...state.current, gesture: next });
}

function finishTransform(options: SchematicPointerOptions, { current, setDraft }: DraftHandlers) {
  if (current === undefined) {
    return;
  }
  const next = transformKeyFromPointer(current.base, { gesture: current.gesture, phase: 'commit' });
  if (
    next === current.base &&
    transformKeyFromPointer(current.base, { gesture: current.gesture, phase: 'preview' }) !==
      current.base
  ) {
    options.onHint('Keys cannot overlap.');
  } else {
    options.commit(
      (project) => (project === current.base ? next : project),
      'Changed key geometry',
    );
  }
  setDraft(undefined);
}
