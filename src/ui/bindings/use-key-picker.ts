import { useRef, useState } from 'react';
import { getSharedBinding } from '../../domain/get-shared-binding';
import type { Modifier, Project } from '../../domain/types';
import { findPickerTabId } from './picker-tabs';
import type { PickerTabId } from './picker-tabs';
import type { PickerItem } from './to-picker-item';

// Hovering a mini key shows its details after a short rest, so sweeping the pointer across
// the grid toward the docs link does not chase every crossed key; focus stays instant.
const HOVER_DETAILS_DELAY_MS = 250;

function useHoverDetails(onShowDetails: (item: PickerItem) => void) {
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDetailsFrozenRef = useRef(false);

  function cancelHoverTimer() {
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }

  function handleHoverItem(item: PickerItem) {
    if (isDetailsFrozenRef.current) {
      return;
    }
    cancelHoverTimer();
    hoverTimerRef.current = setTimeout(() => {
      onShowDetails(item);
    }, HOVER_DETAILS_DELAY_MS);
  }

  function handleFocusItem(item: PickerItem) {
    cancelHoverTimer();
    onShowDetails(item);
  }

  function handleDetailsFreeze() {
    isDetailsFrozenRef.current = true;
    cancelHoverTimer();
  }

  function handleDetailsUnfreeze() {
    isDetailsFrozenRef.current = false;
  }

  return { handleHoverItem, handleFocusItem, handleDetailsFreeze, handleDetailsUnfreeze };
}

// Open tab, search text, modifiers chosen before a key, the tap being re-picked, and the
// item shown in the details line: UI state, never saved or undone (spec 004 R14).
export function useKeyPicker(project: Project, selectedKeyIds: readonly string[]) {
  const [tabId, setTabId] = useState<PickerTabId>('basic');
  const [search, setSearch] = useState('');
  const [pendingModifiers, setPendingModifiers] = useState<readonly Modifier[]>([]);
  const [editingTap, setEditingTap] = useState<number | undefined>();
  const [detailsItem, setDetailsItem] = useState<PickerItem | undefined>();
  const hover = useHoverDetails(setDetailsItem);

  return {
    tabId,
    search,
    pendingModifiers,
    editingTap,
    detailsItem,
    shared: getSharedBinding(project, { layerIndex: 0, keyIds: selectedKeyIds }),
    setPendingModifiers,
    setEditingTap,
    handleTabChange: setTabId,
    handleSearchChange: setSearch,
    handleHoverItem: hover.handleHoverItem,
    handleFocusItem: hover.handleFocusItem,
    handleDetailsFreeze: hover.handleDetailsFreeze,
    handleDetailsUnfreeze: hover.handleDetailsUnfreeze,
    // A new selection opens the tab of its current action and clears the search (FR-009a).
    // Unassigned or mixed selections leave the open tab alone by not touching it, so rapid
    // selection changes cannot restore a stale tab from the render closure.
    syncSelection: (keyIds: readonly string[]) => {
      const shared = getSharedBinding(project, { layerIndex: 0, keyIds });
      const nextTabId = findPickerTabId(shared.kind === 'same' ? shared.binding : undefined);
      if (nextTabId !== undefined) {
        setTabId(nextTabId);
      }
      setSearch('');
      setPendingModifiers([]);
      setEditingTap(undefined);
    },
  };
}

export type KeyPickerState = ReturnType<typeof useKeyPicker>;
