import { SchematicEditorPanel } from './schematic-editor-panel';
import { EncoderPanel } from '@ui/schematic/encoders/components';
import { WiringControls, ControllerPanel } from '@ui/schematic/wiring/components';
import { LayoutControls } from '@ui/schematic/layout/components';
import { PartsList, PartsWireSectionsTable } from '@ui/schematic/parts/components';
import { SchematicCanvas } from './schematic-canvas';
import { getSchematicMarks } from '@ui/schematic/rendering/logic';
import { ToolWindow } from '@ui/schematic/tools/components';
import { useSchematicWorkspace } from '@ui/schematic/logic';

import { useState } from 'react';

export function SchematicWorkspace() {
  const workspace = useSchematicWorkspace();
  const { project, issues, commit, selection } = workspace;
  const marks = getSchematicMarks(
    workspace.canvasIssues.filter((issue) => issue.workspaceId === 'schematic'),
  );

  return (
    <section aria-label="Schematic editing area" className="schematic-editing-area">
      <div className="schematic-canvas-pane">
        <WorkspaceCanvas workspace={workspace} marks={marks} />
      </div>
      <SchematicEditorPanel>
        <ControllerPanel project={project} commit={commit} />
        <WorkspaceLayoutControls workspace={workspace} />
        <WorkspaceWiringControls workspace={workspace} />
        <EncoderPanel />
        <PartsList
          commit={commit}
          issues={issues}
          onSelectionChange={workspace.handleSelectionChange}
          project={project}
          selection={selection}
        />
      </SchematicEditorPanel>
    </section>
  );
}

type Workspace = ReturnType<typeof useSchematicWorkspace>;

type WorkspaceCanvasProps = {
  readonly workspace: Workspace;
  readonly marks: ReturnType<typeof getSchematicMarks>;
};

function WorkspaceCanvas({ workspace, marks }: WorkspaceCanvasProps) {
  const { project, commit, selection, pointer, activeToolId } = workspace;
  const [focusedKeyId, setFocusedKeyId] = useState<string | undefined>();
  function handleKeyFocus(keyId: string) {
    setFocusedKeyId(keyId);
    if (
      selection?.kind !== 'multi' &&
      selection?.kind !== 'sections' &&
      !(selection?.kind === 'key' && selection.keyId === keyId)
    ) {
      workspace.handleSelectionChange({ kind: 'key', keyId });
    }
  }
  const marquee = toMarquee(pointer.drag);
  return (
    <SchematicCanvas
      {...pointer.surfaceHandlers}
      activeKeyId={getActiveKeyId(project, selection, focusedKeyId)}
      commit={commit}
      hoverPreview={pointer.hoverPreview}
      isReadOnly={workspace.wiring.hasPreview}
      hasTransformFrames={
        activeToolId === 'select' && !workspace.layout.hasPreview && !workspace.wiring.hasPreview
      }
      marks={marks}
      marquee={marquee}
      onKeyFocus={handleKeyFocus}
      onKeyKeyDown={workspace.handleKeyKeyDown}
      project={getPreviewProject(workspace)}
      selection={selection}
    >
      <ToolWindow
        activeToolId={activeToolId}
        hint={workspace.hint}
        onToolChange={workspace.handleToolChange}
      />
    </SchematicCanvas>
  );
}

function WorkspaceLayoutControls({ workspace }: { readonly workspace: Workspace }) {
  const { project, issues, commit, selection } = workspace;
  return (
    <LayoutControls
      commit={commit}
      hasPreview={workspace.layout.hasPreview}
      canApply={workspace.layout.canApply}
      issues={issues}
      onApply={workspace.layout.handleApply}
      onCancel={workspace.layout.handleCancel}
      onPreview={workspace.layout.handlePreview}
      onSelectionChange={workspace.handleSelectionChange}
      project={project}
      selection={selection}
    />
  );
}

function toMarquee(drag: ReturnType<typeof useSchematicWorkspace>['pointer']['drag']) {
  return drag?.kind === 'marquee' ? { start: drag.start, end: drag.end } : undefined;
}

function getActiveKeyId(
  project: Workspace['project'],
  selection: Workspace['selection'],
  focusedKeyId: string | undefined,
) {
  if (project.keys.some((key) => key.id === focusedKeyId)) {
    return focusedKeyId;
  }
  if (selection?.kind === 'key') {
    return selection.keyId;
  }
  return project.keys[0]?.id;
}

function getPreviewProject(workspace: Workspace) {
  if (workspace.wiring.hasPreview) {
    return workspace.wiring.previewProject;
  }
  return workspace.layout.hasPreview
    ? workspace.layout.previewProject
    : workspace.pointer.previewProject;
}

function WorkspaceWiringControls({ workspace }: { readonly workspace: Workspace }) {
  return (
    <WiringControls {...workspace.wiring}>
      <PartsWireSectionsTable
        isReadOnly
        project={workspace.wiring.previewProject}
        issues={[]}
        selection={workspace.selection}
        onSelectionChange={workspace.handleSelectionChange}
        commit={workspace.commit}
      />
    </WiringControls>
  );
}
