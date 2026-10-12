import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PREFERENCES,
  DEFAULT_VIEWPORT,
  loadPreferences,
  parsePreferences,
  savePreferences,
} from './preferences';

const VALID_V1 = {
  version: 1,
  theme: 'dark',
  gridSizeU: 0.5,
  isGridVisible: false,
  isSnapEnabled: false,
  areRulersVisible: false,
  isMinimapVisible: true,
  activeWorkspaceId: 'bindings',
  isIssuesPanelOpen: true,
  isPartsListOpen: false,
  toolWindow: { xPx: 40, yPx: 80, isCollapsed: true },
  isBindingsPanelOpen: false,
  isBindingsTableOpen: true,
  isAutoAdvanceEnabled: false,
  actionPanelWidthPx: 400,
  bindingsLayerIndex: 2,
  viewByWorkspace: {
    schematic: { zoom: 2, panXPx: 10, panYPx: -5 },
    bindings: { zoom: 0.5, panXPx: 0, panYPx: 0 },
  },
};

function storageStub(overrides: Partial<Storage>): Storage {
  return {
    length: 0,
    clear: vi.fn<() => void>(),
    getItem: vi.fn<(key: string) => string | null>(() => null),
    key: vi.fn<(index: number) => string | null>(() => null),
    removeItem: vi.fn<(key: string) => void>(),
    setItem: vi.fn<(key: string, value: string) => void>(),
    ...overrides,
  };
}

describe('parsePreferences', () => {
  it('returns defaults with status missing for null', () => {
    expect(parsePreferences(null)).toEqual({ preferences: DEFAULT_PREFERENCES, status: 'missing' });
  });

  it('parses a valid v1 value', () => {
    expect(parsePreferences(JSON.stringify(VALID_V1))).toEqual({
      preferences: VALID_V1,
      status: 'ok',
    });
  });

  it('keeps valid fields and defaults an invalid one', () => {
    const result = parsePreferences('{"version":1,"theme":"dark","gridSizeU":"huge"}');
    expect(result.status).toBe('ok');
    expect(result.preferences.theme).toBe('dark');
    expect(result.preferences.gridSizeU).toBe(0.25);
  });

  it('opens the parts list for a stored v1 value that predates it (spec 003)', () => {
    const result = parsePreferences('{"version":1,"theme":"dark"}');
    expect(result.preferences.isPartsListOpen).toBe(true);
    expect(
      parsePreferences('{"version":1,"isPartsListOpen":false}').preferences.isPartsListOpen,
    ).toBe(false);
  });

  it('opens the key picker, collapses the Keys table and auto-advances for older values (spec 004)', () => {
    const result = parsePreferences('{"version":1,"theme":"dark"}');
    expect(result.preferences.isBindingsPanelOpen).toBe(true);
    expect(result.preferences.isBindingsTableOpen).toBe(false);
    expect(result.preferences.isAutoAdvanceEnabled).toBe(true);
    expect(result.preferences.actionPanelWidthPx).toBe(448);
    expect(result.preferences.theme).toBe('dark');
  });

  it.each([100, 900])('defaults an action panel width outside 240..640 (%s)', (widthPx) => {
    const result = parsePreferences(JSON.stringify({ version: 1, actionPanelWidthPx: widthPx }));
    expect(result.preferences.actionPanelWidthPx).toBe(448);
  });

  it('opens the first layer for older values (spec 007)', () => {
    expect(parsePreferences('{"version":1}').preferences.bindingsLayerIndex).toBe(0);
  });

  it.each([-1, 1.5, '2'])('opens the first layer for a stored layer position %j', (index) => {
    const result = parsePreferences(JSON.stringify({ version: 1, bindingsLayerIndex: index }));
    expect(result.preferences.bindingsLayerIndex).toBe(0);
  });

  it('defaults a grid size outside 0.05..2', () => {
    const result = parsePreferences('{"version":1,"gridSizeU":3}');
    expect(result.preferences.gridSizeU).toBe(0.25);
  });

  it.each(['{broken', '[]', '{"version":99}'])(
    'returns defaults with status corrupt for %s',
    (raw) => {
      expect(parsePreferences(raw)).toEqual({
        preferences: DEFAULT_PREFERENCES,
        status: 'corrupt',
      });
    },
  );

  it('defaults an unknown workspace id', () => {
    const result = parsePreferences('{"version":1,"activeWorkspaceId":"layout"}');
    expect(result.preferences.activeWorkspaceId).toBe('schematic');
  });

  it('defaults a viewport with zoom outside 0.25..4', () => {
    const raw = JSON.stringify({
      version: 1,
      viewByWorkspace: { schematic: { zoom: 10, panXPx: 0, panYPx: 0 } },
    });
    const result = parsePreferences(raw);
    expect(result.preferences.viewByWorkspace.schematic).toEqual(DEFAULT_VIEWPORT);
  });

  it('keeps a saved schematic viewport when the stored value predates bindings', () => {
    const schematic = { zoom: 2, panXPx: 10, panYPx: -5 };
    const result = parsePreferences(JSON.stringify({ version: 1, viewByWorkspace: { schematic } }));
    expect(result.status).toBe('ok');
    expect(result.preferences.viewByWorkspace.schematic).toEqual(schematic);
    expect(result.preferences.viewByWorkspace.bindings).toEqual(DEFAULT_VIEWPORT);
  });
});

describe('loadPreferences / savePreferences', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns defaults with status unavailable when storage throws', () => {
    vi.stubGlobal(
      'localStorage',
      storageStub({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    );
    expect(loadPreferences()).toEqual({ preferences: DEFAULT_PREFERENCES, status: 'unavailable' });
  });

  it('returns false when setItem throws', () => {
    vi.stubGlobal(
      'localStorage',
      storageStub({
        setItem: () => {
          throw new Error('quota');
        },
      }),
    );
    expect(savePreferences(DEFAULT_PREFERENCES)).toBe(false);
  });

  it('returns true when setItem succeeds', () => {
    vi.stubGlobal('localStorage', storageStub({}));
    expect(savePreferences(DEFAULT_PREFERENCES)).toBe(true);
  });
});
