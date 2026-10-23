import * as z from 'zod';

export const PREFERENCES_STORAGE_KEY = 'zmk-customizer:preferences';

export type WorkspaceId = 'schematic' | 'bindings' | 'firmware' | 'export';
export type CanvasWorkspaceId = 'schematic' | 'bindings';
export type Theme = 'system' | 'light' | 'dark';

export type Viewport = {
  readonly zoom: number;
  readonly panXPx: number;
  readonly panYPx: number;
};

export type ToolWindowState = {
  readonly xPx: number;
  readonly yPx: number;
  readonly isCollapsed: boolean;
};

export type Preferences = {
  readonly version: 1;
  readonly theme: Theme;
  readonly gridSizeU: number;
  readonly isGridVisible: boolean;
  readonly isSnapEnabled: boolean;
  readonly areRulersVisible: boolean;
  readonly activeWorkspaceId: WorkspaceId;
  readonly isIssuesPanelOpen: boolean;
  /** Schematic parts list expanded (spec 003); missing in older stored values → default. */
  readonly isPartsListOpen: boolean;
  readonly toolWindow: ToolWindowState;
  /** Bindings: docked key picker expanded, Keys table expanded, move to the next key after a
   * pick (spec 004 R14); missing in older stored values → default. */
  readonly isBindingsPanelOpen: boolean;
  readonly isBindingsTableOpen: boolean;
  readonly isAutoAdvanceEnabled: boolean;
  /** Bindings Action panel width in px; clamped to the resize limits, missing → default. */
  readonly actionPanelWidthPx: number;
  readonly schematicEditorWidthPx: number;
  /** Bindings: position of the open layer (spec 007 R6); clamped to the project's layers in render. */
  readonly bindingsLayerIndex: number;
  readonly viewByWorkspace: Readonly<Record<CanvasWorkspaceId, Viewport>>;
};

export type PreferencesLoadStatus = 'ok' | 'missing' | 'corrupt' | 'unavailable';

export type PreferencesLoadResult = {
  readonly preferences: Preferences;
  readonly status: PreferencesLoadStatus;
};

export const DEFAULT_VIEWPORT: Viewport = { zoom: 1, panXPx: 0, panYPx: 0 };

export const DEFAULT_PREFERENCES: Preferences = {
  version: 1,
  theme: 'system',
  gridSizeU: 0.25,
  isGridVisible: true,
  isSnapEnabled: true,
  areRulersVisible: true,
  activeWorkspaceId: 'schematic',
  isIssuesPanelOpen: false,
  isPartsListOpen: true,
  // Clear of the 20 px rulers.
  toolWindow: { xPx: 28, yPx: 28, isCollapsed: false },
  isBindingsPanelOpen: true,
  isBindingsTableOpen: false,
  isAutoAdvanceEnabled: true,
  actionPanelWidthPx: 448,
  schematicEditorWidthPx: 448,
  bindingsLayerIndex: 0,
  viewByWorkspace: { schematic: DEFAULT_VIEWPORT, bindings: DEFAULT_VIEWPORT },
};

const viewportSchema = z
  .object({
    zoom: z.number().min(0.25).max(4),
    panXPx: z.number(),
    panYPx: z.number(),
  })
  .catch(DEFAULT_VIEWPORT);

// Each field falls back on its own so one damaged value does not reset the rest (research R3).
const preferencesSchema = z.object({
  version: z.literal(1),
  theme: z.enum(['system', 'light', 'dark']).catch(DEFAULT_PREFERENCES.theme),
  gridSizeU: z.number().min(0.05).max(2).catch(DEFAULT_PREFERENCES.gridSizeU),
  isGridVisible: z.boolean().catch(DEFAULT_PREFERENCES.isGridVisible),
  isSnapEnabled: z.boolean().catch(DEFAULT_PREFERENCES.isSnapEnabled),
  areRulersVisible: z.boolean().catch(DEFAULT_PREFERENCES.areRulersVisible),
  activeWorkspaceId: z
    .enum(['schematic', 'bindings', 'firmware', 'export'])
    .catch(DEFAULT_PREFERENCES.activeWorkspaceId),
  isIssuesPanelOpen: z.boolean().catch(DEFAULT_PREFERENCES.isIssuesPanelOpen),
  isPartsListOpen: z.boolean().catch(DEFAULT_PREFERENCES.isPartsListOpen),
  toolWindow: z
    .object({ xPx: z.number(), yPx: z.number(), isCollapsed: z.boolean() })
    .catch(DEFAULT_PREFERENCES.toolWindow),
  isBindingsPanelOpen: z.boolean().catch(DEFAULT_PREFERENCES.isBindingsPanelOpen),
  isBindingsTableOpen: z.boolean().catch(DEFAULT_PREFERENCES.isBindingsTableOpen),
  isAutoAdvanceEnabled: z.boolean().catch(DEFAULT_PREFERENCES.isAutoAdvanceEnabled),
  actionPanelWidthPx: z.number().min(240).max(640).catch(DEFAULT_PREFERENCES.actionPanelWidthPx),
  schematicEditorWidthPx: z
    .number()
    .min(320)
    .max(640)
    .catch(DEFAULT_PREFERENCES.schematicEditorWidthPx),
  bindingsLayerIndex: z.int().min(0).catch(DEFAULT_PREFERENCES.bindingsLayerIndex),
  viewByWorkspace: z
    .object({
      schematic: viewportSchema.catch(DEFAULT_VIEWPORT),
      bindings: viewportSchema.catch(DEFAULT_VIEWPORT),
    })
    .catch(DEFAULT_PREFERENCES.viewByWorkspace),
}) satisfies z.ZodType<Preferences>;

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function parsePreferences(raw: string | null): PreferencesLoadResult {
  if (raw === null) {
    return { preferences: DEFAULT_PREFERENCES, status: 'missing' };
  }
  const result = preferencesSchema.safeParse(parseJson(raw));
  if (!result.success) {
    return { preferences: DEFAULT_PREFERENCES, status: 'corrupt' };
  }
  return { preferences: result.data, status: 'ok' };
}

export function loadPreferences(): PreferencesLoadResult {
  try {
    return parsePreferences(localStorage.getItem(PREFERENCES_STORAGE_KEY));
  } catch {
    return { preferences: DEFAULT_PREFERENCES, status: 'unavailable' };
  }
}

export function savePreferences(preferences: Preferences): boolean {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}
