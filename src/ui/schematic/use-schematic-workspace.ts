import { useLayoutPreview } from './use-layout-preview';
import { useState } from 'react';
import type { Project } from '../../domain/types';
import { usePreferences } from '../preferences-context';
import { useProject } from '../project-context';
import type { Commit } from './pointer-types';
import type { SchematicSelection } from './schematic-selection';
import type { ToolId } from './tools';
import { useSchematicKeyboard } from './use-schematic-keyboard';
import { useEditingPointer } from './use-editing-pointer';

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
  const { project, commit } = input;
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
  const layout = useLayoutPreview(project, selection, commit);
  const handleToolChange = (toolId: ToolId) => {
    pointer.cancelDraft();
    layout.handleCancel();
    handleHintClear();
    setActiveToolId(toolId);
  };
  const handleKeyKeyDown = useSchematicKeyboard({
    ...input,
    selection,
    activeToolId,
    pointer,
    layout,
    onSelectionChange: handleSelectionChange,
    onToolChange: handleToolChange,
  });
  return {
    selection,
    activeToolId,
    hint,
    pointer: getEditingPointer(pointer, layout.hasPreview),
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
