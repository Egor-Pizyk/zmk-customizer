// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { expect, it } from 'vitest';
import { usePickerState } from '@ui/bindings';

it('persists the reset so returning to a layer never revives its draft', () => {
  const base = { layerId: 'l0', layerIndex: 0 };
  const { result, rerender } = renderHook(usePickerState, { initialProps: base });
  act(() => {
    result.current.setDraftState({
      draft: { behaviorId: 'lt', layerId: 'l2' },
      over: { kind: 'unassigned' },
      layerIndex: 0,
    });
    result.current.setPendingModifiers(['LC']);
    result.current.setSearch('space');
  });
  expect(result.current.draftState?.draft).toEqual({ behaviorId: 'lt', layerId: 'l2' });
  rerender({ layerId: 'l1', layerIndex: 1 });
  expect(result.current.draftState).toBeUndefined();
  rerender(base);
  const returned = result.current;
  expect(returned.draftState).toBeUndefined();
  expect(returned.pendingModifiers).toEqual([]);
  expect(returned.search).toBe('');
});
