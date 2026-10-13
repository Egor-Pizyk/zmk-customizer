import { useState } from 'react';
import { LayoutControls } from './layout-controls';
import { getSelectedKeyIds } from './get-selected-key-ids';
import { ControllerPanel } from './controller-panel';
import { PartsList } from './parts-list';
import { SchematicCanvas } from './schematic-canvas';
import { getSchematicMarks } from './schematic-marks';
import { ToolWindow } from './tool-window';
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
      hasTransformFrames={activeToolId === 'select' && !workspace.layout.hasPreview}
      marks={marks}
      marquee={marquee}
      onKeyFocus={handleKeyFocus}
      onKeyKeyDown={workspace.handleKeyKeyDown}
      project={
        workspace.layout.hasPreview ? workspace.layout.previewProject : pointer.previewProject
      }
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
