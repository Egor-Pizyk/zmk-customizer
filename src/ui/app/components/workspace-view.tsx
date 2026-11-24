import { useEffect, useRef } from 'react';
import { useProject } from '@ui/project/logic';
import type { ReactNode } from 'react';
import type { WorkspaceId } from '@storage/preferences';
import { BindingsWorkspace } from '@ui/bindings/components';
import type { GithubSession } from '@ui/export/logic';
import { ExportWorkspace } from '@ui/export/components';
import { FirmwareWorkspace } from '@ui/firmware/components';
import { SchematicWorkspace } from '@ui/schematic/components';
import { getWorkspaceLabel } from '@ui/navigation';

const WORKSPACE_VIEWS: Record<WorkspaceId, (github: GithubSession) => ReactNode> = {
  schematic: () => <SchematicWorkspace />,
  bindings: () => <BindingsWorkspace />,
  firmware: () => <FirmwareWorkspace />,
  export: (github) => <ExportWorkspace github={github} />,
};

type WorkspaceViewProps = {
  readonly workspaceId: WorkspaceId;
  readonly github: GithubSession;
};

// Document title, <h1> and body of the active workspace.
export function WorkspaceView({ workspaceId, github }: WorkspaceViewProps) {
  const { sessionId } = useProject();
  const headingRef = useWorkspaceHeadingFocus(workspaceId);
  const label = getWorkspaceLabel(workspaceId);
  return (
    <>
      <title>{`${label} — ZMK Customizer`}</title>
      <h1 className="px-4 pt-3 pb-2 text-lg font-semibold" ref={headingRef} tabIndex={-1}>
        {label}
      </h1>
      <section className="flex min-h-0 flex-1 flex-col" key={sessionId}>
        {WORKSPACE_VIEWS[workspaceId](github)}
      </section>
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
