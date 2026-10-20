import type { Project } from '@domain';
import type { Commit } from './pointer-types';
import type { SchematicSelection, SelectionChange } from './schematic-selection';
import { createShortcutHandlers, focusKeyLater } from './schematic-shortcut-handlers';
import type { ToolId } from '@ui/schematic/tools/logic';
import { createKeyKeyboardHandler } from './use-key-keyboard';
import { useSchematicShortcuts } from './use-schematic-shortcuts';
import type { KeyboardEvent } from 'react';

type SchematicKeyboardOptions = {
  readonly wiring?: { readonly hasPreview: boolean; readonly handleCancel: () => void };
  readonly project: Project;
  readonly announce?: (message: string) => void;
  readonly layout: { readonly hasPreview: boolean; readonly handleCancel: () => void };
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
  useSchematicShortcuts({
    ...createShortcutHandlers({
      ...options,
      hasDraft: pointer.hasDraft || options.layout.hasPreview,
      onDraftCancel: () => {
        pointer.cancelDraft();
        options.layout.handleCancel();
      },
    }),
    onWiringCancel: options.wiring?.handleCancel,
    hasWiringPreview: options.wiring?.hasPreview,
  });
  const keyKeyboard = createKeyKeyboardHandler({
    project,
    gridSizeU,
    commit,
    selection: options.selection,
    onSelectionChange: options.onSelectionChange,
    onFocusKey: focusKeyLater,
  });
  return (keyId: string, event: KeyboardEvent<SVGGElement>) => {
    keyKeyboard(keyId, event);
  };
}
