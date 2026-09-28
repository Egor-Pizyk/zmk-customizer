import type { KeyboardEvent } from 'react';
import type { Project } from '../../domain/types';
import type { Commit } from './pointer-types';
import type { SchematicSelection, SelectionChange } from './schematic-selection';
import { createShortcutHandlers, focusKeyLater } from './schematic-shortcut-handlers';
import type { ToolId } from './tools';
import { createKeyKeyboardHandler } from './use-key-keyboard';
import { useSchematicShortcuts } from './use-schematic-shortcuts';

type SchematicKeyboardOptions = {
  readonly project: Project;
  readonly commit: Commit;
  readonly gridSizeU: number;
  readonly selection: SchematicSelection;
  readonly activeToolId: ToolId;
  readonly onSelectionChange: SelectionChange;
  readonly onToolChange: (toolId: ToolId) => void;
  readonly pointer: { readonly hasDraft: boolean; readonly cancelDraft: () => void };
};

// Canvas-wide keys (tools, Enter, Delete, Escape) plus the handler for a focused key's own keys.
export function useSchematicKeyboard(options: SchematicKeyboardOptions) {
  const { project, commit, gridSizeU, pointer } = options;
  useSchematicShortcuts(
    createShortcutHandlers({
      ...options,
      hasDraft: pointer.hasDraft,
      onDraftCancel: pointer.cancelDraft,
    }),
  );
  const keyKeyboard = createKeyKeyboardHandler({
    project,
    gridSizeU,
    commit,
    onFocusKey: focusKeyLater,
  });
  return (keyId: string, event: KeyboardEvent<SVGGElement>) => {
    keyKeyboard(keyId, event);
  };
}
