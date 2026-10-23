import { startEncoderDrag, moveEncoderDrag, endEncoderDrag } from './pointer-encoder';
import { isKeyPositionFree } from '@domain/geometry';
import { getSelectedKeyIds } from './get-selected-key-ids';
import { moveKeys } from '@domain/keys';
import { getWireBendsResourceError, setWireBends } from '@domain/wires/editing';
import type { Key, WirePoint } from '@domain';
import { isKeyCellInMarquee } from '@ui/canvas/logic';
import type { PointerState, SelectionPress } from './pointer-types';
import { snapPoint } from './snap-point';
import { getBendDragBends, insertBendAt, startBendDrag } from './get-bend-drag-bends';

type Press = SelectionPress;

// Below this the marquee is treated as a click on empty space, not a drag.
const MARQUEE_MIN_SIZE_U = 0.05;

function focusBoardPinSelect(input: { readonly wireId: string; readonly side: string }) {
  // The board pin select in the Parts list is where a free end is edited (003 T059).
  requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>(`[data-board-pin-select="${input.wireId}:${input.side}"]`)
      ?.focus();
  });
}

function isKeyInMarquee(key: Key, marquee: { start: WirePoint; end: WirePoint }): boolean {
  return isKeyCellInMarquee(key, marquee);
}

function startMultiKeyDrag(state: PointerState, world: WirePoint, event: Press['event']) {
  if (state.selection?.kind !== 'multi') {
    return;
  }
  event.currentTarget.setPointerCapture(event.pointerId);
  const keyStarts = state.selection.keyIds.map((keyId) => {
    const key = state.project.keys.find((candidate) => candidate.id === keyId);
    return { keyId, start: key ? { xU: key.xU, yU: key.yU } : { xU: 0, yU: 0 } };
  });
  const first = keyStarts[0];
  if (first === undefined) {
    return;
  }
  state.onDragChange({
    kind: 'multi-key',
    keyIds: state.selection.keyIds,
    origin: world,
    keyStarts,
    position: first.start,
  });
}

function startSingleKeyDrag(
  state: PointerState,
  world: WirePoint,
  event: Press['event'] & { keyId: string },
) {
  const key = state.project.keys.find((candidate) => candidate.id === event.keyId);
  state.onSelectionChange({ kind: 'key', keyId: event.keyId });
  if (key !== undefined) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const keyStart = { xU: key.xU, yU: key.yU };
    state.onDragChange({
      kind: 'key',
      keyId: key.id,
      origin: world,
      keyStart,
      position: keyStart,
    });
  }
}

export function pressSelectTool(state: PointerState, { hit, world, event }: Press) {
  if (startEncoderDrag(state, { hit, world, event })) {
    return;
  }
  if (hit.kind === 'key' || hit.kind === 'pin') {
    pressKey(state, { hit, world, event });
    return;
  }
  if (hit.kind === 'bend') {
    startBendDrag(state, { hit, world, event });
    return;
  }
  if (hit.kind === 'section') {
    selectSection(state, { sectionId: hit.sectionId, shiftKey: event.shiftKey });
    return;
  }
  if (hit.kind === 'wire') {
    state.onSelectionChange({ kind: 'wire', wireId: hit.wireId });
    return;
  }
  if (hit.kind === 'wire-end') {
    state.onSelectionChange({ kind: 'wire-end', wireId: hit.wireId, side: hit.side });
    focusBoardPinSelect(hit);
    return;
  }
  // Empty space: start marquee selection
  event.currentTarget.setPointerCapture(event.pointerId);
  state.onDragChange({ kind: 'marquee', start: world, end: world });
}

export function doubleClickSelectTool(
  state: PointerState,
  input: { readonly hit: Press['hit']; readonly world: WirePoint },
) {
  if (input.hit.kind === 'section' || input.hit.kind === 'wire') {
    insertBendAt(state, { wireId: input.hit.wireId, point: input.world });
  }
}

export function moveSelectDrag(state: PointerState, world: WirePoint) {
  const { drag } = state;
  if (drag?.kind === 'encoder') {
    moveEncoderDrag(state, drag, world);
    return;
  }
  if (drag?.kind === 'key') {
    const moved = {
      xU: drag.keyStart.xU + world.xU - drag.origin.xU,
      yU: drag.keyStart.yU + world.yU - drag.origin.yU,
    };
    state.onDragChange({ ...drag, position: snapPoint(moved, state.snapGridU) });
  }
  if (drag?.kind === 'multi-key') {
    const first = drag.keyStarts[0];
    if (first === undefined) {
      return;
    }
    const moved = {
      xU: first.start.xU + world.xU - drag.origin.xU,
      yU: first.start.yU + world.yU - drag.origin.yU,
    };
    state.onDragChange({ ...drag, position: snapPoint(moved, state.snapGridU) });
  }
  if (drag?.kind === 'bend') {
    state.onDragChange({ ...drag, point: snapPoint(world, state.snapGridU) });
  }
  if (drag?.kind === 'marquee') {
    state.onDragChange({ ...drag, end: world });
  }
}

function endMarqueeDrag(state: PointerState, project: PointerState['project']) {
  const { drag } = state;
  if (drag?.kind !== 'marquee') {
    return;
  }
  const width = Math.abs(drag.end.xU - drag.start.xU);
  const height = Math.abs(drag.end.yU - drag.start.yU);
  if (width < MARQUEE_MIN_SIZE_U && height < MARQUEE_MIN_SIZE_U) {
    state.onSelectionChange();
    return;
  }
  const keyIds = project.keys.filter((key) => isKeyInMarquee(key, drag)).map((key) => key.id);
  const wireIds: readonly string[] = [];
  if (keyIds.length === 0 && wireIds.length === 0) {
    state.onSelectionChange();
  } else {
    state.onSelectionChange({ kind: 'multi', keyIds, wireIds });
  }
}

function endMultiKeyDrag(state: PointerState, project: PointerState['project']) {
  const { drag } = state;
  if (drag?.kind !== 'multi-key') {
    return;
  }
  const first = drag.keyStarts[0];
  if (first === undefined) {
    return;
  }
  const dx = drag.position.xU - first.start.xU;
  const dy = drag.position.yU - first.start.yU;
  if (dx === 0 && dy === 0) {
    return;
  }
  const targetPositions = drag.keyStarts.map((ks) => ({
    keyId: ks.keyId,
    position: { xU: ks.start.xU + dx, yU: ks.start.yU + dy },
  }));
  const movingKeyIds = targetPositions.map((tp) => tp.keyId);
  const allFree = targetPositions.every((tp) =>
    isKeyPositionFree(project, {
      position: tp.position,
      key: project.keys.find((key) => key.id === tp.keyId),
      ignoreKeyIds: movingKeyIds,
    }),
  );
  if (!allFree) {
    state.onHint('There is already a key here.');
    return;
  }
  commitKeyMove(state, targetPositions);
}

function endSingleKeyDrag(state: PointerState, project: PointerState['project']) {
  const { drag } = state;
  if (drag?.kind !== 'key') {
    return;
  }
  const { keyId, position, keyStart } = drag;
  if (position.xU === keyStart.xU && position.yU === keyStart.yU) {
    return;
  }
  if (!isKeyPositionFree(project, { position, ignoreKeyId: keyId })) {
    state.onHint('There is already a key here.');
    return;
  }
  commitKeyMove(state, [{ keyId, position }]);
}

export function endSelectDrag(state: PointerState) {
  const { drag, project } = state;
  state.onDragChange();
  if (drag?.kind === 'encoder') {
    endEncoderDrag(state, drag);
    return;
  }
  if (drag?.kind === 'bend') {
    const input = { wireId: drag.wireId, bends: getBendDragBends(project, drag) };
    const resourceError = getWireBendsResourceError(project, input);
    if (resourceError !== undefined) {
      state.onHint(resourceError);
      return;
    }
    state.commit((current) => setWireBends(current, input));
    return;
  }
  if (drag?.kind === 'marquee') {
    endMarqueeDrag(state, project);
    return;
  }
  if (drag?.kind === 'multi-key') {
    endMultiKeyDrag(state, project);
    return;
  }
  endSingleKeyDrag(state, project);
}

function selectSection(
  state: PointerState,
  input: { readonly sectionId: string; readonly shiftKey: boolean },
) {
  const previous =
    input.shiftKey && state.selection?.kind === 'sections' && state.selection.base === state.project
      ? state.selection.sectionIds
      : [];
  const sectionIds = previous.includes(input.sectionId)
    ? previous.filter((id) => id !== input.sectionId)
    : [...previous, input.sectionId];
  state.onSelectionChange({ kind: 'sections', base: state.project, sectionIds });
}

function commitKeyMove(state: PointerState, moves: Parameters<typeof moveKeys>[1]['moves']) {
  const next = moveKeys(state.project, { moves });
  if (next === state.project) {
    state.onHint(
      'Move refused to preserve electrical connections or processing limits. Repair the affected wires, then retry.',
    );
    return;
  }
  state.commit((current) => (current === state.project ? next : current));
}

function pressKey(state: PointerState, { hit, world, event }: Press) {
  if (hit.kind !== 'key' && hit.kind !== 'pin') {
    return;
  }
  if (event.ctrlKey || event.metaKey || event.shiftKey) {
    const selected = getSelectedKeyIds(state.selection);
    const keyIds = selected.includes(hit.keyId)
      ? selected.filter((id) => id !== hit.keyId)
      : [...selected, hit.keyId];
    state.onSelectionChange({ kind: 'multi', keyIds, wireIds: [] });
    return;
  }
  if (state.selection?.kind === 'multi' && state.selection.keyIds.includes(hit.keyId)) {
    startMultiKeyDrag(state, world, event);
    return;
  }
  startSingleKeyDrag(state, world, { ...event, keyId: hit.keyId });
}
