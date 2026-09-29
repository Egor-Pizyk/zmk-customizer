import { PartsList } from './parts-list';
import { SchematicCanvas } from './schematic-canvas';
import { getSchematicMarks } from './schematic-marks';
import { ToolWindow } from './tool-window';
import { useSchematicWorkspace } from './use-schematic-workspace';

export function SchematicWorkspace() {
  const workspace = useSchematicWorkspace();
  const { project, issues, commit, selection, activeToolId, pointer } = workspace;
  const marks = getSchematicMarks(issues.filter((issue) => issue.workspaceId === 'schematic'));

  function handleKeyFocus(keyId: string) {
    workspace.handleSelectionChange({ kind: 'key', keyId });
  }

  const selectedKeyId = selection?.kind === 'key' ? selection.keyId : undefined;
  const marquee = toMarquee(pointer.drag);
  return (
    <>
      <SchematicCanvas
        {...pointer.surfaceHandlers}
        activeKeyId={selectedKeyId ?? project.keys[0]?.id}
        commit={commit}
        hoverPreview={pointer.hoverPreview}
        marks={marks}
        marquee={marquee}
        onKeyFocus={handleKeyFocus}
        onKeyKeyDown={workspace.handleKeyKeyDown}
        project={pointer.previewProject}
        selection={selection}
      >
        <ToolWindow
          activeToolId={activeToolId}
          hint={workspace.hint}
          onToolChange={workspace.handleToolChange}
        />
      </SchematicCanvas>
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

function toMarquee(drag: ReturnType<typeof useSchematicWorkspace>['pointer']['drag']) {
  return drag?.kind === 'marquee' ? { start: drag.start, end: drag.end } : undefined;
}
