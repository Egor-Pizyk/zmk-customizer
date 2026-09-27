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
  readonly isMinimapVisible: boolean;
  readonly activeWorkspaceId: WorkspaceId;
  readonly isIssuesPanelOpen: boolean;
  readonly toolWindow: ToolWindowState;
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
  isMinimapVisible: true,
  activeWorkspaceId: 'schematic',
  isIssuesPanelOpen: false,
  // Clear of the 20 px rulers.
  toolWindow: { xPx: 28, yPx: 28, isCollapsed: false },
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
  isMinimapVisible: z.boolean().catch(DEFAULT_PREFERENCES.isMinimapVisible),
  activeWorkspaceId: z
    .enum(['schematic', 'bindings', 'firmware', 'export'])
    .catch(DEFAULT_PREFERENCES.activeWorkspaceId),
  isIssuesPanelOpen: z.boolean().catch(DEFAULT_PREFERENCES.isIssuesPanelOpen),
  toolWindow: z
    .object({ xPx: z.number(), yPx: z.number(), isCollapsed: z.boolean() })
    .catch(DEFAULT_PREFERENCES.toolWindow),
  viewByWorkspace: z
    .object({ schematic: viewportSchema, bindings: viewportSchema })
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
