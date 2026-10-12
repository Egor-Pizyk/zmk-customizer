import type { SharedBinding } from '../../domain/get-shared-binding';
import { isSameBinding } from '../../domain/is-same-binding';
import type { KeyStroke } from '../../domain/types';
import type { BindingDraft, DraftBehaviorId, LineSource } from './binding-slots';

/** A draft, the selection binding it was made over (spec 006 FR-009) and its layer (spec 007). */
export type DraftState = {
  readonly draft: BindingDraft;
  readonly over: SharedBinding;
  readonly layerIndex: number;
};

export const DEFAULT_HOLD: KeyStroke = { keycode: 'LEFT_SHIFT', modifiers: [] };

/** A new draft: mod-tap starts with Left Shift as its hold, the rest empty. */
export function createDraft(behaviorId: DraftBehaviorId): BindingDraft {
  return behaviorId === 'mt' ? { behaviorId, hold: DEFAULT_HOLD } : { behaviorId };
}

function isSameShared(first: SharedBinding, second: SharedBinding): boolean {
  if (first.kind === 'same' && second.kind === 'same') {
    return isSameBinding(first.binding, second.binding);
  }
  return first.kind === second.kind;
}

// The draft while the selection still holds the binding it was made over, so stepping through
// empty keys keeps "&kp"; a pick, paste or undo that changes the binding shows the binding, and
// any change of the open layer drops it (spec 007 FR-007).
export function resolveLineSource(
  shared: SharedBinding,
  input: { readonly draftState: DraftState | undefined; readonly layerIndex: number },
): LineSource {
  const { draftState, layerIndex } = input;
  if (draftState?.layerIndex === layerIndex && isSameShared(draftState.over, shared)) {
    return { kind: 'draft', draft: draftState.draft };
  }
  if (shared.kind === 'same') {
    return { kind: 'binding', binding: shared.binding };
  }
  return { kind: 'none', isMixed: shared.kind === 'mixed' };
}
