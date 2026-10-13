import { useSchematicPreviews } from './use-schematic-previews';
import { useState } from 'react';
import type { Project } from '@domain';
import { usePreferences } from '@ui/preferences';
import { useProject } from '@ui/project';
import type { Commit } from './interaction/pointer-types';
import type { SchematicSelection } from './interaction/schematic-selection';
import type { ToolId } from './tools/tools';
import { useSchematicKeyboard } from './interaction/use-schematic-keyboard';
import { useEditingPointer } from './interaction/use-editing-pointer';

type InteractionInput = {
  readonly project: Project;
  readonly commit: Commit;
  readonly announce: (text: string) => void;
  readonly gridSizeU: number;
  readonly isSnapEnabled: boolean;
};

// Shown in the tool window and announced once by StatusMessage.
function useCanvasHint(announce: (text: string) => void) {
  const [hint, setHint] = useState<string | undefined>();
  return {
    hint,
    handleHint: (text: string) => {
      setHint(text);
      announce(text);
    },
    handleHintClear: () => {
      setHint(undefined);
    },
  };
}

function useSchematicInteraction(input: InteractionInput) {
  const {
    selection,
    activeToolId,
    hint,
    pointer,
    layout,
    wiring,
    keyboardLayout,
    handleSelectionChange,
    handleToolChange,
  } = useInteractionState(input);
  const handleKeyKeyDown = useInteractionKeyboard(input, {
    selection,
    activeToolId,
    pointer,
    layout: keyboardLayout,
    wiring,
    onSelectionChange: handleSelectionChange,
    onToolChange: handleToolChange,
  });
  return {
    selection,
    activeToolId,
    hint,
    pointer: getEditingPointer(pointer, layout.hasPreview || wiring.hasPreview),
    wiring,
    layout,
    handleSelectionChange,
    handleToolChange,
    handleKeyKeyDown,
  };
}

// Schematic UI state (tool, selection, drag, wire draft); the project stays in ProjectProvider and
// changes only through domain operations (react.md "Project state").
export function useSchematicWorkspace() {
  const { project, issues, commit, announce } = useProject();
  const { gridSizeU, isSnapEnabled } = usePreferences().preferences;
  const interaction = useSchematicInteraction({
    project,
    commit,
    announce,
    gridSizeU,
    isSnapEnabled,
  });
  return { project, issues, commit, ...interaction };
}

function useWorkspacePointer(
  input: InteractionInput,
  handlers: Pick<
    Parameters<typeof useEditingPointer>[0],
    'activeToolId' | 'selection' | 'onSelectionChange' | 'onHint' | 'onHintClear'
  >,
) {
  return useEditingPointer({
    project: input.project,
    commit: input.commit,
    snapGridU: input.isSnapEnabled ? input.gridSizeU : undefined,
    ...handlers,
  });
}

function getEditingPointer(pointer: ReturnType<typeof useEditingPointer>, hasPreview: boolean) {
  return hasPreview
    ? {
        ...pointer,
        surfaceHandlers: {
          ...pointer.surfaceHandlers,
          onPointerDown: () => {
            /* Preview is read-only until Apply or Cancel. */
          },
        },
      }
    : pointer;
}

function createToolChangeHandler(
  setActiveToolId: (toolId: ToolId) => void,
  handlers: {
    wiring: { handleCancel: () => void };
    pointer: { cancelDraft: () => void };
    layout: { handleCancel: () => void };
    handleHintClear: () => void;
  },
) {
  const { wiring, pointer, layout, handleHintClear } = handlers;
  const handleToolChange = (toolId: ToolId) => {
    wiring.handleCancel();
    pointer.cancelDraft();
    layout.handleCancel();
    handleHintClear();
    setActiveToolId(toolId);
  };

  return handleToolChange;
}

function useInteractionKeyboard(
  input: InteractionInput,
  handlers: Omit<Parameters<typeof useSchematicKeyboard>[0], keyof InteractionInput>,
) {
  return useSchematicKeyboard({ ...input, ...handlers });
}

function useInteractionState(input: InteractionInput) {
  const { project } = input;
  const [activeToolId, setActiveToolId] = useState<ToolId>('select');
  const [selection, setSelection] = useState<SchematicSelection>();
  const { hint, handleHint, handleHintClear } = useCanvasHint(input.announce);
  const handleSelectionChange = setSelection;
  const pointer = useWorkspacePointer(input, {
    activeToolId,
    selection,
    onSelectionChange: handleSelectionChange,
    onHint: handleHint,
    onHintClear: handleHintClear,
  });
  const { layout, wiring, keyboardLayout } = useSchematicPreviews(project, selection, {
    commit: input.commit,
    pointer,
  });
  const handleToolChange = createToolChangeHandler(setActiveToolId, {
    wiring,
    pointer,
    layout,
    handleHintClear,
  });

  return {
    selection,
    activeToolId,
    hint,
    pointer,
    layout,
    wiring,
    keyboardLayout,
    handleSelectionChange,
    handleToolChange,
  };
}
