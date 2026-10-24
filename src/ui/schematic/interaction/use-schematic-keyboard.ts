import type { Project } from '@domain';
import type { Commit } from './pointer-types';
import type { SchematicSelection, SelectionChange } from './schematic-selection';
import { createShortcutHandlers, focusKeyLater } from './schematic-shortcut-handlers';
import type { ToolId } from '@ui/schematic/tools/logic';
import { createKeyKeyboardHandler } from './use-key-keyboard';
import { useKeyClipboard } from './use-key-clipboard';
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
  const { project, gridSizeU, pointer } = options;
  const commit = getKeyboardCommit(options);
  const clipboard = useKeyClipboard({
    selection: options.selection,
    onSelectionChange: options.onSelectionChange,
    hasDraft: pointer.hasDraft || options.layout.hasPreview || options.wiring?.hasPreview === true,
  });
  useSchematicShortcuts({
    ...clipboard,
    ...createShortcutHandlers({
      ...options,
      commit,
      isReadOnly: options.wiring?.hasPreview === true,
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

function getKeyboardCommit(options: SchematicKeyboardOptions): Commit {
  return (change, message) => {
    if (options.wiring?.hasPreview === true) {
      options.announce?.('Apply or cancel wiring before editing.');
      return;
    }
    options.commit(change, message);
  };
}
