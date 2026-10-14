import { describe, expect, it } from 'vitest';
import { clampPanelPosition, panelPositionForKey } from '@ui/components/logic';

const PANEL = { widthPx: 100, heightPx: 50 };
const CONTAINER = { widthPx: 400, heightPx: 300 };

describe('clampPanelPosition', () => {
  it('keeps a position that is already inside', () => {
    expect(clampPanelPosition({ xPx: 20, yPx: 30 }, PANEL, CONTAINER)).toEqual({
      xPx: 20,
      yPx: 30,
    });
  });

  it('pulls a panel past the right and bottom edges back inside', () => {
    expect(clampPanelPosition({ xPx: 390, yPx: 290 }, PANEL, CONTAINER)).toEqual({
      xPx: 300,
      yPx: 250,
    });
  });

  it('clamps negative positions to 0', () => {
    expect(clampPanelPosition({ xPx: -5, yPx: -10 }, PANEL, CONTAINER)).toEqual({ xPx: 0, yPx: 0 });
  });

  it('pins a panel larger than the container to 0', () => {
    const container = { widthPx: 80, heightPx: 40 };
    expect(clampPanelPosition({ xPx: 10, yPx: 10 }, PANEL, container)).toEqual({ xPx: 0, yPx: 0 });
  });
});

describe('panelPositionForKey', () => {
  it('moves 16 px per arrow press', () => {
    expect(panelPositionForKey({ xPx: 20, yPx: 20 }, 'ArrowRight', false)).toEqual({
      xPx: 36,
      yPx: 20,
    });
  });

  it('moves 64 px with Shift', () => {
    expect(panelPositionForKey({ xPx: 100, yPx: 100 }, 'ArrowUp', true)).toEqual({
      xPx: 100,
      yPx: 36,
    });
  });

  it('ignores other keys', () => {
    expect(panelPositionForKey({ xPx: 0, yPx: 0 }, 'a', false)).toBeUndefined();
  });
});
