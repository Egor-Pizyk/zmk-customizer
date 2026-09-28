import { addKey } from '../../domain/add-key';
import { createEntityId } from '../../domain/create-entity-id';
import { findFreeKeyPosition } from '../../domain/find-free-key-position';
import { removeKey } from '../../domain/remove-key';
import { removeWire } from '../../domain/remove-wire';
import type { Project } from '../../domain/types';
import type { Commit } from './pointer-types';
import type { SchematicSelection, SelectionChange } from './schematic-selection';
import type { ToolId } from './tools';

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
  readonly onDraftCancel: () => void;
};

function deleteSelection(input: ShortcutHandlerInput) {
  const { project, commit, selection, onSelectionChange } = input;
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
  const keyId = createEntityId({ prefix: 'k', existingIds: project.keys.map((key) => key.id) });
  commit(
    (current) => addKey(current, { position: findFreeKeyPosition(current) }),
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
