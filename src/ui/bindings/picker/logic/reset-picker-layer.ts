import type { Modifier } from '@domain';
import type { SlotRef } from './binding-slots';
import type { DraftState } from './draft-state';

export type PickerState = {
  readonly layerId: string | undefined;
  readonly layerIndex: number;
  readonly openSlot: SlotRef | undefined;
  readonly search: string;
  readonly pendingModifiers: readonly Modifier[];
  readonly draftState: DraftState | undefined;
};

// Identity catches deletion at the same position; position catches moving the open layer.
export function resetPickerLayer(
  state: PickerState,
  layer: Pick<PickerState, 'layerId' | 'layerIndex'>,
): PickerState {
  if (state.layerId === layer.layerId && state.layerIndex === layer.layerIndex) {
    return state;
  }
  return { ...state, ...layer, search: '', pendingModifiers: [], draftState: undefined };
}
