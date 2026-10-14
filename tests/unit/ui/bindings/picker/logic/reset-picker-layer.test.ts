import { resetPickerLayer } from '@ui/bindings/picker/logic';
import { expect, it } from 'vitest';

it('discards an unfinished draft permanently after switching away and back', () => {
  const initial = {
    layerId: 'l0',
    layerIndex: 0,
    openSlot: { kind: 'tap' } as const,
    search: 'space',
    pendingModifiers: ['LC'] as const,
    draftState: {
      draft: { behaviorId: 'lt', layerId: 'l2' } as const,
      over: { kind: 'unassigned' } as const,
      layerIndex: 0,
    },
  };
  const away = resetPickerLayer(initial, { layerId: 'l1', layerIndex: 1 });
  const back = resetPickerLayer(away, { layerId: 'l0', layerIndex: 0 });
  expect(back.draftState).toBeUndefined();
  expect(back.pendingModifiers).toEqual([]);
  expect(back.search).toBe('');
  expect(back.openSlot).toEqual({ kind: 'tap' });
});

it('drops a draft when deletion replaces the layer at the same position', () => {
  const initial = {
    layerId: 'l1',
    layerIndex: 1,
    openSlot: undefined,
    search: '',
    pendingModifiers: [],
    draftState: {
      draft: { behaviorId: 'mo' } as const,
      over: { kind: 'unassigned' } as const,
      layerIndex: 1,
    },
  };
  expect(resetPickerLayer(initial, { layerId: 'l2', layerIndex: 1 }).draftState).toBeUndefined();
  expect(resetPickerLayer(initial, { layerId: 'l1', layerIndex: 1 })).toBe(initial);
});
