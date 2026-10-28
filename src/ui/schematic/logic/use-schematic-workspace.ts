import { getEditingPointer } from './get-editing-pointer';
import { useSchematicPreviews } from './use-schematic-previews';
import { createDiagramGestureSession } from '@ui/schematic/diagram/logic';
import type { DiagramGestureSession } from '@ui/schematic/diagram/logic';
import type { Project } from '@domain';
import { usePreferences } from '@ui/preferences';
import { toWorkspaceIssues } from '@ui/issues';
import { getProjectAnalysis, useProject } from '@ui/project/logic';
import { useSchematicKeyboard, useEditingPointer } from '@ui/schematic/interaction';
import type { Commit, SchematicSelection } from '@ui/schematic/interaction';
import type { ToolId } from '@ui/schematic/tools/logic';

import { useRef, useState } from 'react';

type InteractionInput = {
  readonly project: Project;
  readonly getGestureSession: () => DiagramGestureSession;
  readonly projectRevision: number;
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
  const { keyboardLayout, ...state } = useInteractionState(input);
  const { pointer, wiring, layout, selection, handleSelectionChange } = state;
  const handleKeyKeyDown = useInteractionKeyboard(
    { ...input, project: wiring.previewProject },
    {
      ...state,
      layout: keyboardLayout,
      onSelectionChange: handleSelectionChange,
      onToolChange: state.handleToolChange,
    },
  );
  return {
    ...state,
    pointer: getEditingPointer(pointer, {
      hasLayoutPreview: layout.hasPreview,
      wiring,
      selection,
      onSelectionChange: handleSelectionChange,
    }),
    handleKeyKeyDown,
  };
}

// Schematic UI state (tool, selection, drag, wire draft); the project stays in ProjectProvider and
// changes only through domain operations (react.md "Project state").
export function useSchematicWorkspace() {
  const { project, issues, commit, announce, importSession } = useProject();
  const gestureSessionRef = useRef(createDiagramGestureSession(importSession.getRevision));
  const getGestureSession = () => gestureSessionRef.current;
  const { gridSizeU, isSnapEnabled } = usePreferences().preferences;
  const interaction = useSchematicInteraction({
    project,
    getGestureSession,
    projectRevision: importSession.getRevision(),
    commit,
    announce,
    gridSizeU,
    isSnapEnabled,
  });
  const canvasIssues = interaction.wiring.hasPreview
    ? toWorkspaceIssues(getProjectAnalysis(interaction.wiring.previewProject).issues)
    : issues;
  return { project, issues, canvasIssues, commit, ...interaction };
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
    getGestureSession: input.getGestureSession,
    projectRevision: input.projectRevision,
    commit: input.commit,
    snapGridU: input.isSnapEnabled ? input.gridSizeU : undefined,
    ...handlers,
  });
}

function createToolChangeHandler(
  setActiveToolId: (toolId: ToolId) => void,
  handlers: {
    wiring: { hasPreview: boolean; handleCancel: () => void };
    onHint: (text: string) => void;
    pointer: { cancelDraft: () => void };
    layout: { handleCancel: () => void };
    handleHintClear: () => void;
  },
) {
  const { wiring, pointer, layout, handleHintClear } = handlers;
  const handleToolChange = (toolId: ToolId) => {
    if (wiring.hasPreview) {
      if (toolId !== 'select') {
        handlers.onHint('Apply or cancel wiring before editing.');
      }
      return;
    }
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
  const { layout, wiring, keyboardLayout } = useSchematicPreviews(input.project, selection, {
    commit: input.commit,
    pointer,
    announce: input.announce,
    onWiringStart: () => {
      setActiveToolId('select');
      setSelection(undefined);
    },
  });
  const handleToolChange = createToolChangeHandler(setActiveToolId, {
    wiring,
    pointer,
    layout,
    handleHintClear,
    onHint: handleHint,
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
