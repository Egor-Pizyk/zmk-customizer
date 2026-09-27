import type { CanvasWorkspaceId, WorkspaceId } from '../storage/preferences';

export type WorkspaceKind = 'canvas' | 'placeholder';

export type Workspace = {
  readonly id: WorkspaceId;
  readonly label: string;
  readonly kind: WorkspaceKind;
};

export const WORKSPACES = [
  { id: 'schematic', label: 'Schematic', kind: 'canvas' },
  { id: 'bindings', label: 'Bindings', kind: 'canvas' },
  { id: 'firmware', label: 'Firmware', kind: 'placeholder' },
  { id: 'export', label: 'Export', kind: 'placeholder' },
] as const satisfies readonly Workspace[];

const CANVAS_WORKSPACE_IDS: ReadonlySet<string> = new Set(['schematic', 'bindings']);

export function isCanvasWorkspaceId(value: string): value is CanvasWorkspaceId {
  return CANVAS_WORKSPACE_IDS.has(value);
}

export function getWorkspaceLabel(id: WorkspaceId): string {
  return WORKSPACES.find((workspace) => workspace.id === id)?.label ?? id;
}
