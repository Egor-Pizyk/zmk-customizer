import { deleteSelection } from './delete-schematic-selection';
import { focusKeyLater } from './focus-schematic';
import { placeEncoderAt } from './place-key-at';
import { PROJECT_BUDGET } from '@storage/project';
import { addKey } from '@domain/keys';
import { createEntityId } from '@domain/project';
import { findFreeKeyPosition } from '@domain/geometry';
import type { Project } from '@domain';
import type { Commit, PointerState } from './pointer-types';
import type { SchematicSelection, SelectionChange } from './schematic-selection';

export type ShortcutHandlerInput = {
  readonly project: Project;
  readonly commit: Commit;
  readonly selection: SchematicSelection;
  readonly onSelectionChange: SelectionChange;
  readonly activeToolId: PointerState['activeToolId'];
  readonly onToolChange: (toolId: PointerState['activeToolId']) => void;
  readonly hasDraft: boolean;
  readonly isReadOnly?: boolean;
  readonly announce?: (message: string) => void;
  readonly onDraftCancel: () => void;
};

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
    onToolChange: (toolId: PointerState['activeToolId']) => {
      input.onToolChange(toolId);
    },
    onPlaceKey: () => {
      if (!refuseReadOnlyEdit(input)) {
        placeFromTool(input);
      }
    },
    onDeleteSelection: () => {
      if (!refuseReadOnlyEdit(input)) {
        deleteSelection(input);
      }
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

function placeFromTool(input: ShortcutHandlerInput) {
  if (input.activeToolId === 'add-encoder') {
    placeEncoderAt(
      {
        project: input.project,
        commit: input.commit,
        onHint: (text) => input.announce?.(text),
      },
      (() => {
        const position = findFreeKeyPosition(input.project);
        return { xU: position.xU + 0.5, yU: position.yU + 0.5 };
      })(),
    );
    return;
  }
  if (input.activeToolId === 'add-key') {
    placeKey(input);
  }
}

function refuseReadOnlyEdit(input: ShortcutHandlerInput): boolean {
  if (input.isReadOnly !== true) {
    return false;
  }
  input.announce?.('Apply or cancel wiring before editing.');
  return true;
}
