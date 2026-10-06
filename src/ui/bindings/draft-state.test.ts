import { expect, it } from 'vitest';
import type { SharedBinding } from '../../domain/get-shared-binding';
import { createDraft, resolveLineSource } from './draft-state';

const UNASSIGNED: SharedBinding = { kind: 'unassigned' };
const KP_A: SharedBinding = {
  kind: 'same',
  binding: { kind: 'kp', key: { keycode: 'A', modifiers: [] } },
};
const KP_Q: SharedBinding = {
  kind: 'same',
  binding: { kind: 'kp', key: { keycode: 'Q', modifiers: [] } },
};

it('shows the stored binding, or nothing to share, without a draft', () => {
  expect(resolveLineSource(KP_A)).toEqual({ kind: 'binding', binding: KP_A.binding });
  expect(resolveLineSource(UNASSIGNED)).toEqual({ kind: 'none', isMixed: false });
  expect(resolveLineSource({ kind: 'mixed' })).toEqual({ kind: 'none', isMixed: true });
});

it('keeps a draft while stepping through keys with the binding it was made over (FR-009)', () => {
  const draftState = { draft: createDraft('kp'), over: UNASSIGNED };
  expect(resolveLineSource(UNASSIGNED, draftState)).toEqual({
    kind: 'draft',
    draft: { behaviorId: 'kp' },
  });
});

it('shows the binding once a pick, paste or undo changes it', () => {
  const draftState = { draft: createDraft('bt'), over: KP_A };
  expect(resolveLineSource(KP_A, draftState).kind).toBe('draft');
  expect(resolveLineSource(KP_Q, draftState).kind).toBe('binding');
  expect(resolveLineSource(UNASSIGNED, draftState).kind).toBe('none');
});

it('starts mod-tap drafts with Left Shift held', () => {
  expect(createDraft('mt')).toEqual({
    behaviorId: 'mt',
    hold: { keycode: 'LEFT_SHIFT', modifiers: [] },
  });
});
