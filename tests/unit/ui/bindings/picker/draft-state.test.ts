import { expect, it } from 'vitest';
import type { SharedBinding } from '@domain';
import { createDraft, resolveLineSource } from '@ui/bindings';

const UNASSIGNED: SharedBinding = { kind: 'unassigned' };
const KP_A: SharedBinding = {
  kind: 'same',
  binding: { kind: 'kp', key: { keycode: 'A', modifiers: [] } },
};
const NO_DRAFT = { draftState: undefined, layerIndex: 0 };
const KP_Q: SharedBinding = {
  kind: 'same',
  binding: { kind: 'kp', key: { keycode: 'Q', modifiers: [] } },
};

it('shows the stored binding, or nothing to share, without a draft', () => {
  expect(resolveLineSource(KP_A, NO_DRAFT)).toEqual({ kind: 'binding', binding: KP_A.binding });
  expect(resolveLineSource(UNASSIGNED, NO_DRAFT)).toEqual({ kind: 'none', isMixed: false });
  expect(resolveLineSource({ kind: 'mixed' }, NO_DRAFT)).toEqual({ kind: 'none', isMixed: true });
});

it('keeps a draft while stepping through keys with the binding it was made over (FR-009)', () => {
  const draftState = { draft: createDraft('kp'), over: UNASSIGNED, layerIndex: 0 };
  expect(resolveLineSource(UNASSIGNED, { draftState, layerIndex: 0 })).toEqual({
    kind: 'draft',
    draft: { behaviorId: 'kp' },
  });
});

it('shows the binding once a pick, paste or undo changes it', () => {
  const draftState = { draft: createDraft('bt'), over: KP_A, layerIndex: 0 };
  expect(resolveLineSource(KP_A, { draftState, layerIndex: 0 }).kind).toBe('draft');
  expect(resolveLineSource(KP_Q, { draftState, layerIndex: 0 }).kind).toBe('binding');
  expect(resolveLineSource(UNASSIGNED, { draftState, layerIndex: 0 }).kind).toBe('none');
});

// Spec 007 FR-007: tabs, problem activation, undo or delete can change the open layer.
it('drops a draft made on another layer, even over the same binding', () => {
  const draftState = { draft: createDraft('kp'), over: UNASSIGNED, layerIndex: 0 };
  expect(resolveLineSource(UNASSIGNED, { draftState, layerIndex: 1 })).toEqual({
    kind: 'none',
    isMixed: false,
  });
});

it('starts mod-tap drafts with Left Shift held', () => {
  expect(createDraft('mt')).toEqual({
    behaviorId: 'mt',
    hold: { keycode: 'LEFT_SHIFT', modifiers: [] },
  });
});
