import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { WorkspaceId } from '../storage/preferences';
import { BindingsWorkspace } from './bindings/bindings-workspace';
import { ExportWorkspace } from './export/export-workspace';
import { FirmwareWorkspace } from './firmware/firmware-workspace';
import { SchematicWorkspace } from './schematic/schematic-workspace';
import { getWorkspaceLabel } from './workspaces';

const WORKSPACE_VIEWS: Record<WorkspaceId, () => ReactNode> = {
  schematic: () => <SchematicWorkspace />,
  bindings: () => <BindingsWorkspace />,
  firmware: () => <FirmwareWorkspace />,
  export: () => <ExportWorkspace />,
};

type WorkspaceViewProps = {
  readonly workspaceId: WorkspaceId;
};

// Document title, <h1> and body of the active workspace.
export function WorkspaceView({ workspaceId }: WorkspaceViewProps) {
  const headingRef = useWorkspaceHeadingFocus(workspaceId);
  const label = getWorkspaceLabel(workspaceId);
  return (
    <>
      <title>{`${label} — ZMK Customizer`}</title>
      <h1 className="px-4 pt-3 pb-2 text-lg font-semibold" ref={headingRef} tabIndex={-1}>
        {label}
      </h1>
      {WORKSPACE_VIEWS[workspaceId]()}
    </>
  );
}

// Moves focus to the heading when the workspace changes, so it is announced. The ref starts at
// the current id, so mount (and StrictMode's double effect) does nothing.
function useWorkspaceHeadingFocus(workspaceId: WorkspaceId) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousWorkspaceIdRef = useRef(workspaceId);
  useEffect(() => {
    if (previousWorkspaceIdRef.current === workspaceId) {
      return;
    }
    previousWorkspaceIdRef.current = workspaceId;
    headingRef.current?.focus();
  }, [workspaceId]);
  return headingRef;
}
