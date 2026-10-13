import { WiringControls } from './wiring/wiring-controls';
import { useState } from 'react';
import { LayoutControls } from './layout/layout-controls';
import { getSelectedKeyIds } from './interaction/get-selected-key-ids';
import { ControllerPanel } from './wiring/controller-panel';
import { PartsList } from './parts/parts-list';
import { SchematicCanvas } from './schematic-canvas';
import { getSchematicMarks } from './rendering/schematic-marks';
import { ToolWindow } from './tools/tool-window';
import { useSchematicWorkspace } from './use-schematic-workspace';

export function SchematicWorkspace() {
  const workspace = useSchematicWorkspace();
  const { project, issues, commit, selection } = workspace;
  const marks = getSchematicMarks(issues.filter((issue) => issue.workspaceId === 'schematic'));

  return (
    <>
      <ControllerPanel project={project} commit={commit} />
      <WorkspaceCanvas workspace={workspace} marks={marks} />
      <WorkspaceLayoutControls workspace={workspace} />
      <WiringControls {...workspace.wiring} />
      <PartsList
        commit={commit}
        issues={issues}
        onSelectionChange={workspace.handleSelectionChange}
        project={project}
        selection={selection}
      />
    </>
  );
}

type Workspace = ReturnType<typeof useSchematicWorkspace>;

function WorkspaceCanvas({
  workspace,
  marks,
}: {
  readonly workspace: Workspace;
  readonly marks: ReturnType<typeof getSchematicMarks>;
}) {
  const { project, commit, selection, pointer, activeToolId } = workspace;
  const [focusedKeyId, setFocusedKeyId] = useState<string | undefined>();
  function handleKeyFocus(keyId: string) {
    setFocusedKeyId(keyId);
    if (selection?.kind !== 'multi' && !getSelectedKeyIds(selection).includes(keyId)) {
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
