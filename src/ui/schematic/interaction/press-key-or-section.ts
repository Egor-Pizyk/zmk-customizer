import { getSelectedKeyIds } from './get-selected-key-ids';
import { getSelectedSectionIds } from './get-selected-section-ids';
import { getKeySectionSelection } from './get-key-section-selection';
import type { PointerState, SelectionPress } from './pointer-types';
import type { WirePoint } from '@domain';

type Press = SelectionPress;

export function pressKeyOrSection(state: PointerState, input: Press): boolean {
  if (input.hit.kind === 'key' || input.hit.kind === 'pin') {
    pressKey(state, input);
    return true;
  }
  if (input.hit.kind === 'section') {
    selectSection(state, { sectionId: input.hit.sectionId, shiftKey: input.event.shiftKey });
    return true;
  }
  return false;
}

function startMultiKeyDrag(state: PointerState, world: WirePoint, event: Press['event']) {
  const selectedKeys = getSelectedKeyIds(state.selection, { project: state.project });
  if (selectedKeys.length === 0) {
    return;
  }
  event.currentTarget.setPointerCapture(event.pointerId);
  const keyStarts = selectedKeys.map((keyId) => {
    const key = state.project.keys.find((candidate) => candidate.id === keyId);
    return { keyId, start: key ? { xU: key.xU, yU: key.yU } : { xU: 0, yU: 0 } };
  });
  const first = keyStarts[0];
  if (first === undefined) {
    return;
  }
  state.onDragChange({
    kind: 'multi-key',
    keyIds: selectedKeys,
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

function selectSection(
  state: PointerState,
  input: { readonly sectionId: string; readonly shiftKey: boolean },
) {
  const previous = input.shiftKey ? getSelectedSectionIds(state.project, state.selection) : [];
  const sectionIds = previous.includes(input.sectionId)
    ? previous.filter((id) => id !== input.sectionId)
    : [...previous, input.sectionId];
  state.onSelectionChange(
    getKeySectionSelection(state.project, {
      sectionIds,
      keyIds: input.shiftKey ? getSelectedKeyIds(state.selection, { project: state.project }) : [],
    }),
  );
}

function pressKey(state: PointerState, { hit, world, event }: Press) {
  if (hit.kind !== 'key' && hit.kind !== 'pin') {
    return;
  }
  if (event.ctrlKey || event.metaKey || event.shiftKey) {
    const selected = getSelectedKeyIds(state.selection, { project: state.project });
    const keyIds = selected.includes(hit.keyId)
      ? selected.filter((id) => id !== hit.keyId)
      : [...selected, hit.keyId];
    state.onSelectionChange(
      getKeySectionSelection(state.project, {
        keyIds,
        sectionIds: getSelectedSectionIds(state.project, state.selection),
      }),
    );
    return;
  }
  if (getSelectedKeyIds(state.selection, { project: state.project }).includes(hit.keyId)) {
    startMultiKeyDrag(state, world, event);
    return;
  }
  startSingleKeyDrag(state, world, { ...event, keyId: hit.keyId });
}
