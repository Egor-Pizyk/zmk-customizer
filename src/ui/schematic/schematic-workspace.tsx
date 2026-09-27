import { WorkSurface } from '../canvas/work-surface';
import { ToolWindow } from './tool-window';

export function SchematicWorkspace() {
  return (
    <WorkSurface workspaceId="schematic">
      <ToolWindow />
    </WorkSurface>
  );
}
