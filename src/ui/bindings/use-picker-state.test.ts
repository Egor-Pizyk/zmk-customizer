import { expect, it, vi } from 'vitest';
import type { SetStateAction } from 'react';
import type { PickerState } from './reset-picker-layer';
import { usePickerState } from './use-picker-state';

const session = vi.hoisted(() => {
  const initial: { state: PickerState | undefined } = { state: undefined };
  return initial;
});

vi.mock('react', () => ({
  useState: (initial: PickerState) => {
    session.state ??= initial;
    return [
      session.state,
      (change: SetStateAction<PickerState>) => {
        const current = session.state ?? initial;
        session.state = typeof change === 'function' ? change(current) : change;
      },
    ];
  },
}));

it('persists the reset so returning to a layer never revives its draft', () => {
  session.state = undefined;
  const base = { layerId: 'l0', layerIndex: 0 };
  const picker = usePickerState(base);
  picker.setDraftState({
    draft: { behaviorId: 'lt', layerId: 'l2' },
    over: { kind: 'unassigned' },
    layerIndex: 0,
  });
  picker.setPendingModifiers(['LC']);
  picker.setSearch('space');
  expect(usePickerState(base).draftState?.draft.layerId).toBe('l2');
  expect(usePickerState({ layerId: 'l1', layerIndex: 1 }).draftState).toBeUndefined();
  const returned = usePickerState(base);
  expect(returned.draftState).toBeUndefined();
  expect(returned.pendingModifiers).toEqual([]);
  expect(returned.search).toBe('');
});
