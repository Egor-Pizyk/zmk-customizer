import { useState } from 'react';
import type { Modifier } from '../../domain/types';
import type { SlotRef } from './binding-slots';
import type { DraftState } from './draft-state';
import { resetPickerLayer } from './reset-picker-layer';
import type { PickerState } from './reset-picker-layer';

export function usePickerState(layer: Pick<PickerState, 'layerId' | 'layerIndex'>) {
  const [state, setState] = useState<PickerState>({
    ...layer,
    openSlot: undefined,
    search: '',
    pendingModifiers: [],
    draftState: undefined,
  });
  const current = resetPickerLayer(state, layer);
  if (current !== state) {
    setState(current);
  }

  function setOpenSlot(slot: SlotRef | undefined) {
    setState((previous) => ({ ...previous, openSlot: slot }));
  }
  function setSearch(text: string) {
    setState((previous) => ({ ...previous, search: text }));
  }
  function setPendingModifiers(modifiers: readonly Modifier[]) {
    setState((previous) => ({ ...previous, pendingModifiers: modifiers }));
  }
  function setDraftState(draft: DraftState | undefined) {
    setState((previous) => ({ ...previous, draftState: draft }));
  }
  return { ...current, setOpenSlot, setSearch, setPendingModifiers, setDraftState };
}
