import type { ContentPointerHandler } from '@ui/canvas/logic';
import { getKeyCenter, getKeyGeometry } from '@domain/geometry';
import {
  getPointerRotationDeg,
  getRotationSnap,
  transformKeyFromPointer,
} from '@domain/geometry/transforms';
import type { RotationSnap, KeyPointerTransform } from '@domain/geometry/transforms';
import type { Project } from '@domain';
import { getSelectedKeyIds } from './get-selected-key-ids';
import type { SchematicPointerOptions } from './pointer-types';
import { readTransformTarget } from './read-transform-target';
import type { useSchematicPointer } from './use-schematic-pointer';

import { useState } from 'react';

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
  readonly rotationSnap?: RotationSnap;
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
    ...(gesture.kind === 'rotate'
      ? { rotationSnap: initialRotationSnap(options.project, gesture.keyId, event.timeStamp) }
      : {}),
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
      : gesture;
  state.setDraft(
    gesture.kind === 'rotate'
      ? moveRotation(options, state.current, [world, event])
      : { ...state.current, gesture: next },
  );
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

function initialRotationSnap(project: Project, keyId: string, timeMs: number): RotationSnap {
  const key = project.keys.find((entry) => entry.id === keyId);
  const angleDeg = key === undefined ? 0 : getKeyGeometry(key).rotationDeg;
  return { angleDeg, rotationDeg: angleDeg, timeMs };
}

function moveRotation(
  options: SchematicPointerOptions,
  draft: Draft,
  [world, event]: Parameters<ContentPointerHandler>,
): Draft {
  const gesture = draft.gesture;
  const key = draft.base.keys.find((entry) => entry.id === gesture.keyId);
  if (gesture.kind !== 'rotate' || key === undefined) {
    return draft;
  }
  const angleDeg = getPointerRotationDeg({
    center: getKeyCenter(key),
    start: gesture.start,
    position: world,
    initialRotationDeg: getKeyGeometry(key).rotationDeg,
  });
  if (angleDeg === undefined) {
    return draft;
  }
  const rotationSnap = getRotationSnap({
    angleDeg,
    timeMs: event.timeStamp,
    previous: draft.rotationSnap,
    isEnabled: options.snapGridU !== undefined,
    isShiftPressed: event.shiftKey,
  });
  return {
    ...draft,
    rotationSnap,
    gesture: { ...gesture, position: world, targetRotationDeg: rotationSnap.rotationDeg },
  };
}
