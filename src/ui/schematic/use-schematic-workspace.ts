import { useState } from 'react';
import type { Project } from '../../domain/types';
import { usePreferences } from '../preferences-context';
import { useProject } from '../project-context';
import type { Commit } from './pointer-types';
import type { SchematicSelection } from './schematic-selection';
import type { ToolId } from './tools';
import { useSchematicKeyboard } from './use-schematic-keyboard';
import { useSchematicPointer } from './use-schematic-pointer';

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
  const { project, commit, gridSizeU } = input;
  const [activeToolId, setActiveToolId] = useState<ToolId>('select');
  const [selection, setSelection] = useState<SchematicSelection>();
  const { hint, handleHint, handleHintClear } = useCanvasHint(input.announce);
  const handleSelectionChange = (next?: SchematicSelection) => {
    setSelection(next);
  };
  const pointer = useSchematicPointer({
    project,
    activeToolId,
    snapGridU: input.isSnapEnabled ? gridSizeU : undefined,
    commit,
    selection,
    onSelectionChange: handleSelectionChange,
    onHint: handleHint,
    onHintClear: handleHintClear,
  });
  const handleToolChange = (toolId: ToolId) => {
    pointer.cancelDraft();
    handleHintClear();
    setActiveToolId(toolId);
  };
  const keyboardOptions = { project, commit, gridSizeU, selection, activeToolId, pointer };
  const handleKeyKeyDown = useSchematicKeyboard({
    ...keyboardOptions,
    onSelectionChange: handleSelectionChange,
    onToolChange: handleToolChange,
  });
  return {
    selection,
    activeToolId,
    hint,
    pointer,
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
