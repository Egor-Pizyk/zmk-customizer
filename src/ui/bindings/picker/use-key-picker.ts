import { getSharedBinding } from '@domain';
import type { Project } from '@domain';
import { resolveOpenSlot } from './binding-slots';
import type { SlotRef } from './binding-slots';
import { resolveLineSource } from './draft-state';
import { usePickerState } from './use-picker-state';

// The open slot, search text, modifiers chosen before a drafted key and the draft: UI state,
// never saved or undone (spec 004 R14, spec 006 FR-009). The open slot is clamped to the line
// in render, so undo or paste that removes it falls back to the first slot.
export function useKeyPicker(
  project: Project,
  target: { readonly layerIndex: number; readonly keyIds: readonly string[] },
) {
  const state = usePickerState({
    layerId: project.layers[target.layerIndex]?.id,
    layerIndex: target.layerIndex,
  });
  const { openSlot, draftState, setOpenSlot, setSearch } = state;
  const shared = getSharedBinding(project, target);
  const source = resolveLineSource(shared, { draftState, layerIndex: target.layerIndex });

  return {
    /** The open layer and the selected keys every pick writes to. */
    target,
    /** Every layer, for layer slots and the names of layer behaviors (spec 007). */
    layers: project.layers,
    shared,
    source,
    slot: resolveOpenSlot(source, openSlot),
    search: state.search,
    pendingModifiers: state.pendingModifiers,
    draftState,
    setPendingModifiers: state.setPendingModifiers,
    setDraftState: state.setDraftState,
    handleSearchChange: setSearch,
    /** No slot: the first slot of the line opens. */
    handleSlotOpen: (slot?: SlotRef) => {
      setOpenSlot(slot);
      setSearch('');
    },
    /** A press on a keycap's behavior tag (spec 006 FR-013). */
    handleBehaviorOpen: () => {
      setOpenSlot({ kind: 'behavior' });
      setSearch('');
    },
    // A new selection opens its first slot with an empty search (spec 006 US1 AS1).
    syncSelection: () => {
      setOpenSlot(undefined);
      setSearch('');
      state.setPendingModifiers([]);
    },
  };
}

export type KeyPickerState = ReturnType<typeof useKeyPicker>;
