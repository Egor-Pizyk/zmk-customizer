import type { ReactNode } from 'react';
import type { WorkspaceId } from '../../storage/preferences';
import { Button } from '../components/button';
import { BindingsIcon } from '../components/icons/bindings-icon';
import { ExportIcon } from '../components/icons/export-icon';
import { FirmwareIcon } from '../components/icons/firmware-icon';
import { SchematicIcon } from '../components/icons/schematic-icon';
import type { Workspace } from '../workspaces';

const ICON_BY_WORKSPACE: Record<WorkspaceId, ReactNode> = {
  schematic: <SchematicIcon />,
  bindings: <BindingsIcon />,
  firmware: <FirmwareIcon />,
  export: <ExportIcon />,
};

type WorkspaceTabProps = {
  readonly workspace: Workspace;
  readonly isCurrent: boolean;
  readonly accessibleName: string;
  readonly onSelect: (workspaceId: WorkspaceId) => void;
  readonly children?: ReactNode;
};

// Narrow screens: icon only, label in a tooltip; lg: shows the label (spec 001 T018).
export function WorkspaceTab({
  workspace,
  isCurrent,
  accessibleName,
  onSelect,
  children,
}: WorkspaceTabProps) {
  function handleClick() {
    onSelect(workspace.id);
  }

  return (
    <Button
      aria-current={isCurrent ? 'page' : undefined}
      aria-label={accessibleName}
      className="w-full lg:justify-start"
      hint={workspace.label}
      hintClassName="lg:hidden!"
      isHintDecorative
      onClick={handleClick}
      variant="nav"
    >
      {ICON_BY_WORKSPACE[workspace.id]}
      <span className="sr-only lg:not-sr-only">{workspace.label}</span>
      {children}
    </Button>
  );
}
