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
  event.currentTarget.focus();
  const geometry = getEncoderGeometry(state.project, encoder);
  state.onSelectionChange({ kind: 'encoder', encoderId: encoder.id });
  event.currentTarget.setPointerCapture(event.pointerId);
  state.onDragChange({
    kind: 'encoder',
    encoderId: encoder.id,
    rotate: hit.kind === 'encoder' && hit.rotate,
    origin: world,
    bodyStart: geometry,
    angleStart: geometry.rotationDeg,
    position: geometry,
    angle: geometry.rotationDeg,
  });
  return true;
}

export function moveEncoderDrag(state: PointerState, drag: EncoderDrag, world: WirePoint) {
  if (drag.rotate) {
    const cx = drag.bodyStart.xU + 0.5;
    const cy = drag.bodyStart.yU + 0.5;
    const delta =
      ((Math.atan2(world.yU - cy, world.xU - cx) -
        Math.atan2(drag.origin.yU - cy, drag.origin.xU - cx)) *
        180) /
      Math.PI;
    state.onDragChange({ ...drag, angle: drag.angleStart + delta });
  } else {
    state.onDragChange({
      ...drag,
      position: snapPoint(
        {
          xU: drag.bodyStart.xU + world.xU - drag.origin.xU,
          yU: drag.bodyStart.yU + world.yU - drag.origin.yU,
        },
        state.snapGridU,
      ),
    });
  }
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
