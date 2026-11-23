import { refuseProtectedEdit } from './refuse-protected-edit';
import { getPointerRotationDeg, getRotationSnap } from '@domain/geometry/transforms';
import { getEncoderGeometry } from '@domain/geometry';
import type { Encoder, WirePoint } from '@domain';
import type { Drag, PointerState, SelectionPress } from './pointer-types';
import { getPreviewProject } from './pointer-preview';
import { snapPoint } from './snap-point';

type Press = SelectionPress;
type EncoderDrag = Extract<Drag, { readonly kind: 'encoder' }>;
function encoderAtHit(state: PointerState, hit: Press['hit']): Encoder | undefined {
  let encoder: Encoder | undefined;
  if (hit.kind === 'encoder' || hit.kind === 'encoder-pin') {
    encoder = state.project.encoders.find((entry) => entry.id === hit.encoderId);
  } else if (hit.kind === 'key' || hit.kind === 'pin') {
    encoder = state.project.encoders.find((entry) => entry.pushKeyId === hit.keyId);
  }
  return encoder;
}

export function startEncoderDrag(state: PointerState, { hit, world, event }: Press): boolean {
  const encoder = encoderAtHit(state, hit);
  if (encoder === undefined) {
    return false;
  }
  // Native text dragging after repeated presses cancels the authored pointer gesture.
  event.preventDefault();
  event.focus();
  const geometry = getEncoderGeometry(state.project, encoder);
  state.onSelectionChange({ kind: 'encoder', encoderId: encoder.id });
  if (refuseProtectedEdit(state, { encoderIds: [encoder.id] })) {
    return true;
  }
  event.capture();
  state.onDragChange({
    kind: 'encoder',
    encoderId: encoder.id,
    rotate: hit.kind === 'encoder' && hit.rotate,
    origin: world,
    bodyStart: geometry,
    angleStart: geometry.rotationDeg,
    position: geometry,
    angle: geometry.rotationDeg,
    rotationSnap: {
      angleDeg: geometry.rotationDeg,
      rotationDeg: geometry.rotationDeg,
      timeMs: event.timeStamp,
    },
  });
  return true;
}

type EncoderMove = {
  readonly world: WirePoint;
  readonly event: Pick<Press['event'], 'timeStamp' | 'shiftKey'> | undefined;
};

export function moveEncoderDrag(state: PointerState, drag: EncoderDrag, input: EncoderMove) {
  if (drag.rotate) {
    moveEncoderRotation(state, drag, input);
    return;
  }
  state.onDragChange({
    ...drag,
    position: snapPoint(
      {
        xU: drag.bodyStart.xU + input.world.xU - drag.origin.xU,
        yU: drag.bodyStart.yU + input.world.yU - drag.origin.yU,
      },
      state.snapGridU,
    ),
  });
}

function moveEncoderRotation(
  state: PointerState,
  drag: EncoderDrag,
  { world, event }: EncoderMove,
) {
  const center = { xU: drag.bodyStart.xU + 0.5, yU: drag.bodyStart.yU + 0.5 };
  const angleDeg = getPointerRotationDeg({
    center,
    start: drag.origin,
    position: world,
    initialRotationDeg: drag.angleStart,
  });
  if (angleDeg === undefined) {
    return;
  }
  const rotationSnap = getRotationSnap({
    angleDeg,
    timeMs: event?.timeStamp ?? 0,
    previous: drag.rotationSnap,
    isEnabled: state.snapGridU !== undefined,
    isShiftPressed: event?.shiftKey ?? false,
  });
  state.onDragChange({ ...drag, rotationSnap, angle: rotationSnap.rotationDeg });
}
export function endEncoderDrag(state: PointerState, drag: EncoderDrag) {
  const next = getPreviewProject(state.project, drag);
  const hasMoved =
    drag.position.xU !== drag.bodyStart.xU ||
    drag.position.yU !== drag.bodyStart.yU ||
    drag.angle !== drag.angleStart;
  if (!hasMoved) {
    return;
  }
  if (next === state.project) {
    state.onHint(
      'Move refused to preserve electrical connections or processing limits. Repair the affected wires, then retry.',
    );
    return;
  }
  state.commit((current) => (current === state.project ? next : current));
}
