import { useState } from 'react';
import { getSharedBinding } from '../../domain/get-shared-binding';
import type { Modifier, Project } from '../../domain/types';
import { resolveOpenSlot } from './binding-slots';
import type { SlotRef } from './binding-slots';
import { resolveLineSource } from './draft-state';
import type { DraftState } from './draft-state';

// The open slot, search text, modifiers chosen before a drafted key and the draft: UI state,
// never saved or undone (spec 004 R14, spec 006 FR-009). The open slot is clamped to the line
// in render, so undo or paste that removes it falls back to the first slot.
export function useKeyPicker(project: Project, selectedKeyIds: readonly string[]) {
  const [openSlot, setOpenSlot] = useState<SlotRef | undefined>();
  const [search, setSearch] = useState('');
  const [pendingModifiers, setPendingModifiers] = useState<readonly Modifier[]>([]);
  const [draftState, setDraftState] = useState<DraftState | undefined>();
  const shared = getSharedBinding(project, { layerIndex: 0, keyIds: selectedKeyIds });
  const source = resolveLineSource(shared, draftState);

  return {
    shared,
    source,
    slot: resolveOpenSlot(source, openSlot),
    search,
    pendingModifiers,
    draftState,
    setPendingModifiers,
    setDraftState,
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
      setPendingModifiers([]);
    },
  };
}

export type KeyPickerState = ReturnType<typeof useKeyPicker>;
