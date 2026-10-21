import { PROJECT_BUDGET } from '@storage/project';
import { addKey, removeKey } from '@domain/keys';
import { createEntityId } from '@domain/project';
import { findFreeKeyPosition } from '@domain/geometry';
import { removeWire, removeWireSections } from '@domain/wires/editing';
import type { Project } from '@domain';
import type { Commit } from './pointer-types';
import type { SchematicSelection, SelectionChange } from './schematic-selection';
import type { ToolId } from '@ui/schematic/tools/logic';

export function focusKeyLater(keyId: string) {
  requestAnimationFrame(() => {
    document.querySelector<SVGGElement>(`[data-key-focus-id="${keyId}"]`)?.focus();
  });
}

// With no keys left, focus returns to the canvas itself (accessibility.md "Focus is never lost").
function focusCanvasLater() {
  requestAnimationFrame(() => {
    document.querySelector<SVGSVGElement>('[data-canvas-workspace="schematic"]')?.focus();
  });
}

type ShortcutHandlerInput = {
  readonly project: Project;
  readonly commit: Commit;
  readonly selection: SchematicSelection;
  readonly onSelectionChange: SelectionChange;
  readonly activeToolId: ToolId;
  readonly onToolChange: (toolId: ToolId) => void;
  readonly hasDraft: boolean;
  readonly announce?: (message: string) => void;
  readonly onDraftCancel: () => void;
};

function deleteSelection(input: ShortcutHandlerInput) {
  const { project, commit, selection, onSelectionChange } = input;
  if (selection?.kind === 'sections') {
    deleteSectionSelection(input);
    return;
  }
  if (selection?.kind === 'key') {
    const keyIndex = project.keys.findIndex((key) => key.id === selection.keyId);
    commit((current) => removeKey(current, { keyId: selection.keyId }), `Deleted key ${keyIndex}`);
    // Focus is never lost: the next key by index, else the previous one (accessibility.md).
    const nextKey = project.keys[keyIndex + 1] ?? project.keys[keyIndex - 1];
    onSelectionChange(nextKey === undefined ? undefined : { kind: 'key', keyId: nextKey.id });
    if (nextKey === undefined) {
      focusCanvasLater();
    } else {
      focusKeyLater(nextKey.id);
    }
    return;
  }
  if (selection?.kind === 'multi') {
    deleteMultiSelection(input);
    return;
  }
  if (selection === undefined) {
    return;
  }
  const wireIndex = project.wires.findIndex((wire) => wire.id === selection.wireId);
  commit(
    (current) => removeWire(current, { wireId: selection.wireId }),
    `Deleted wire ${wireIndex}`,
  );
  onSelectionChange();
}

function placeKey(input: ShortcutHandlerInput) {
  const { project, commit, onSelectionChange } = input;
  if (project.keys.length >= PROJECT_BUDGET.keys) {
    return;
  }
  const keyId = createEntityId({ prefix: 'k', existingIds: project.keys.map((key) => key.id) });
  commit(
    (current) =>
      addKey(current, { position: findFreeKeyPosition(current), maxKeyCount: PROJECT_BUDGET.keys }),
    `Added key ${project.keys.length}`,
  );
  onSelectionChange({ kind: 'key', keyId });
  focusKeyLater(keyId);
}

export function createShortcutHandlers(input: ShortcutHandlerInput) {
  return {
    onToolChange: (toolId: ToolId) => {
      input.onDraftCancel();
      input.onToolChange(toolId);
    },
    onPlaceKey: () => {
      if (input.activeToolId === 'add-key') {
        placeKey(input);
      }
    },
    onDeleteSelection: () => {
      deleteSelection(input);
    },
    onCancel: () => {
      if (input.hasDraft) {
        input.onDraftCancel();
        return;
      }
      input.onSelectionChange();
      if (input.activeToolId !== 'select') {
        input.onToolChange('select');
      }
    },
  };
}

function deleteSectionSelection(input: ShortcutHandlerInput) {
  const { project, commit, selection, onSelectionChange } = input;
  if (selection?.kind === 'sections') {
    if (selection.base !== project) {
      onSelectionChange();
      return;
    }
    const result = removeWireSections(project, { base: project, sectionIds: selection.sectionIds });
    if (result.ok) {
      commit(
        (current) => (current === project ? result.value : current),
        `Deleted ${selection.sectionIds.length} wire sections. Undo`,
      );
    }
    if (!result.ok) {
      input.announce?.(result.error);
    }
    onSelectionChange();
    focusCanvasLater();
  }
}

function deleteMultiSelection(input: ShortcutHandlerInput) {
  const { commit, selection, onSelectionChange } = input;
  if (selection?.kind === 'multi') {
    const { keyIds, wireIds } = selection;
    commit((current) => {
      let next = current;
      for (const wireId of wireIds) {
        next = removeWire(next, { wireId });
      }
      for (const keyId of keyIds) {
        next = removeKey(next, { keyId });
      }
      return next;
    });
    onSelectionChange();
    focusCanvasLater();
  }
}
