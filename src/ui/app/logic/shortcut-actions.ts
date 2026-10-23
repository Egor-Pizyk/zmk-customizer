import type { CanvasWorkspaceId, Preferences, Viewport, WorkspaceId } from '@storage/preferences';
import { SHARED_VIEW_WORKSPACE_ID, ZOOM_STEP, panViewportByU, zoomAt } from '@ui/canvas/logic';
import type { PanDelta, ScreenPoint } from '@ui/canvas/logic';
import type { ShortcutId } from '@ui/shortcuts';

export type ShortcutAction =
  | { readonly kind: 'change-preferences'; readonly changes: Partial<Preferences> }
  | { readonly kind: 'open-settings' }
  | { readonly kind: 'open-help' }
  | { readonly kind: 'undo' | 'redo' | 'save-project' | 'open-project' };

export type ShortcutContext = {
  readonly preferences: Preferences;
  readonly focusedCanvas: CanvasWorkspaceId | undefined;
  readonly surfaceCenter: ScreenPoint;
};

type ViewChange = (viewport: Viewport, context: ShortcutContext) => Viewport;

const WORKSPACE_BY_SHORTCUT: Partial<Record<ShortcutId, WorkspaceId>> = {
  'workspace-schematic': 'schematic',
  'workspace-bindings': 'bindings',
  'workspace-firmware': 'firmware',
  'workspace-export': 'export',
};

function pan(dxU: number, dyU: number, isGridStep: boolean): ViewChange {
  return (viewport, { preferences }) => {
    const stepU = isGridStep ? preferences.gridSizeU : 1;
    const delta: PanDelta = { dxU: dxU * stepU, dyU: dyU * stepU };
    return panViewportByU(viewport, delta);
  };
}

const VIEW_CHANGE_BY_SHORTCUT: Partial<Record<ShortcutId, ViewChange>> = {
  'zoom-in': (viewport, { surfaceCenter }) => zoomAt(viewport, ZOOM_STEP, surfaceCenter),
  'zoom-out': (viewport, { surfaceCenter }) => zoomAt(viewport, 1 / ZOOM_STEP, surfaceCenter),
  'pan-left': pan(-1, 0, true),
  'pan-right': pan(1, 0, true),
  'pan-up': pan(0, -1, true),
  'pan-down': pan(0, 1, true),
  'pan-left-1u': pan(-1, 0, false),
  'pan-right-1u': pan(1, 0, false),
  'pan-up-1u': pan(0, -1, false),
  'pan-down-1u': pan(0, 1, false),
};

const TOGGLE_BY_SHORTCUT: Partial<
  Record<ShortcutId, 'isSnapEnabled' | 'isGridVisible' | 'isIssuesPanelOpen'>
> = {
  'toggle-snap': 'isSnapEnabled',
  'toggle-grid': 'isGridVisible',
  'toggle-issues-panel': 'isIssuesPanelOpen',
};

// Pure mapping so App stays small and the dispatch is testable without a DOM.
export function getShortcutAction(
  shortcutId: ShortcutId,
  context: ShortcutContext,
): ShortcutAction | undefined {
  const { preferences, focusedCanvas } = context;
  if (
    shortcutId === 'open-settings' ||
    shortcutId === 'open-help' ||
    shortcutId === 'undo' ||
    shortcutId === 'redo' ||
    shortcutId === 'save-project' ||
    shortcutId === 'open-project'
  ) {
    return { kind: shortcutId };
  }
  const workspaceId = WORKSPACE_BY_SHORTCUT[shortcutId];
  if (workspaceId !== undefined) {
    return { kind: 'change-preferences', changes: { activeWorkspaceId: workspaceId } };
  }
  const toggle = TOGGLE_BY_SHORTCUT[shortcutId];
  if (toggle !== undefined) {
    return { kind: 'change-preferences', changes: { [toggle]: !preferences[toggle] } };
  }
  const viewChange = VIEW_CHANGE_BY_SHORTCUT[shortcutId];
  if (viewChange === undefined || focusedCanvas === undefined) {
    return undefined;
  }
  const viewport = viewChange(preferences.viewByWorkspace[SHARED_VIEW_WORKSPACE_ID], context);
  const viewByWorkspace = { ...preferences.viewByWorkspace, [SHARED_VIEW_WORKSPACE_ID]: viewport };
  return { kind: 'change-preferences', changes: { viewByWorkspace } };
}
