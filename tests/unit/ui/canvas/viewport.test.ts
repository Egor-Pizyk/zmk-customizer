import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWPORT } from '@storage/preferences';
import {
  PX_PER_U,
  ZOOM_STEP,
  WHEEL_ZOOM_STEP,
  centerViewportAt,
  displayGridStep,
  panViewportByU,
  resetViewport,
  screenToWorld,
  zoomAt,
} from '@ui/canvas';

it('reduces button and wheel zoom increments by a third and keeps zoom steps reversible', () => {
  expect(ZOOM_STEP - 1).toBeCloseTo((0.25 * 2) / 3);
  expect(WHEEL_ZOOM_STEP - 1).toBeCloseTo((0.1 * 2) / 3);
  const anchor = { xPx: 200, yPx: 100 };
  const restored = zoomAt(
    zoomAt(DEFAULT_VIEWPORT, WHEEL_ZOOM_STEP, anchor),
    1 / WHEEL_ZOOM_STEP,
    anchor,
  );
  expect(restored.zoom).toBeCloseTo(1);
  expect(restored.panXPx).toBeCloseTo(0);
  expect(restored.panYPx).toBeCloseTo(0);
});

it('places the keyboard center at the surface center without changing zoom', () => {
  const world = { xU: -2.5, yU: 4 };
  const screen = { xPx: 350, yPx: 200 };
  const centered = centerViewportAt({ zoom: 2, panXPx: 1000, panYPx: -80 }, { world, screen });
  expect(centered.zoom).toBe(2);
  expect(screenToWorld(screen, centered)).toEqual(world);
});

describe('screenToWorld', () => {
  it('maps screen px to key units at the default view', () => {
    expect(screenToWorld({ xPx: 48, yPx: 96 }, DEFAULT_VIEWPORT)).toEqual({ xU: 1, yU: 2 });
  });

  it('accounts for zoom and pan', () => {
    const point = screenToWorld({ xPx: 48, yPx: 0 }, { zoom: 2, panXPx: 10, panYPx: 0 });
    expect(point.xU).toBeCloseTo((48 - 10) / 96);
  });
});

describe('displayGridStep', () => {
  it('keeps a grid step that is already readable', () => {
    expect(displayGridStep(0.25, 1)).toBe(0.25);
  });

  it('doubles a dense step until it is at least 6 px on screen', () => {
    expect(displayGridStep(0.05, 1)).toBe(0.2);
  });

  it('stays readable when zoomed out', () => {
    expect(displayGridStep(0.05, 0.25) * PX_PER_U * 0.25).toBeGreaterThanOrEqual(6);
  });
});

describe('zoomAt', () => {
  it('keeps the world point under the anchor fixed', () => {
    const viewport = { zoom: 1.3, panXPx: 25, panYPx: -40 };
    const anchor = { xPx: 210, yPx: 130 };
    const before = screenToWorld(anchor, viewport);
    const after = screenToWorld(anchor, zoomAt(viewport, 1.25, anchor));
    expect(after.xU).toBeCloseTo(before.xU);
    expect(after.yU).toBeCloseTo(before.yU);
  });

  it('clamps zoom to 0.25..4', () => {
    const anchor = { xPx: 0, yPx: 0 };
    expect(zoomAt(DEFAULT_VIEWPORT, 100, anchor).zoom).toBe(4);
    expect(zoomAt(DEFAULT_VIEWPORT, 0.001, anchor).zoom).toBe(0.25);
  });

  it('returns an equal viewport when already at the limit', () => {
    const viewport = { zoom: 4, panXPx: 12, panYPx: 7 };
    expect(zoomAt(viewport, 1.25, { xPx: 50, yPx: 50 })).toEqual(viewport);
  });
});

describe('resetViewport / panViewportByU', () => {
  it('resets to the default view', () => {
    expect(resetViewport()).toEqual(DEFAULT_VIEWPORT);
  });

  it('pans by key units at the current zoom', () => {
    const viewport = panViewportByU({ zoom: 2, panXPx: 0, panYPx: 0 }, { dxU: 1, dyU: 0 });
    expect(viewport.panXPx).toBe(-96);
    expect(viewport.panYPx).toBe(0);
  });
});
