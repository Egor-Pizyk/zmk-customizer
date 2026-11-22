import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES, DEFAULT_VIEWPORT } from '@storage/preferences';
import { getShortcutAction } from '@ui/app/logic';
import type { ShortcutContext } from '@ui/app/logic';

const CONTEXT: ShortcutContext = {
  preferences: DEFAULT_PREFERENCES,
  focusedCanvas: 'bindings',
  surfaceCenter: { xPx: 200, yPx: 100 },
};

// Schematic and Bindings share one view (spec 004 FR-001): the Bindings canvas moves it too.
function sharedPan(panXPx: number) {
  return { changes: { viewByWorkspace: { schematic: { panXPx } } } };
}

describe('getShortcutAction', () => {
  it('zooms the shared canvas view around the focused canvas center', () => {
    const factor = 1 + (0.25 * 2) / 3;
    expect(getShortcutAction('zoom-in', CONTEXT)).toMatchObject({
      kind: 'change-preferences',
      changes: {
        viewByWorkspace: {
          schematic: { zoom: factor, panXPx: 200 - 200 * factor, panYPx: 100 - 100 * factor },
          bindings: DEFAULT_VIEWPORT,
        },
      },
    });
  });

  it('pans by the grid step, or by 1u with Shift', () => {
    expect(getShortcutAction('pan-right', CONTEXT)).toMatchObject(
      sharedPan(-48 * DEFAULT_PREFERENCES.gridSizeU),
    );
    expect(getShortcutAction('pan-right-1u', CONTEXT)).toMatchObject(sharedPan(-48));
  });

  it('ignores canvas actions without a focused canvas', () => {
    expect(getShortcutAction('zoom-in', { ...CONTEXT, focusedCanvas: undefined })).toBeUndefined();
  });
});
