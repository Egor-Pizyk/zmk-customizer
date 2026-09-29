import { describe, expect, it } from 'vitest';
import {
  ACTION_PANEL_DEFAULT_WIDTH_PX,
  ACTION_PANEL_MAX_WIDTH_PX,
  ACTION_PANEL_MIN_WIDTH_PX,
  actionPanelWidthForKey,
  clampActionPanelWidth,
} from './action-panel-width';

describe('clampActionPanelWidth', () => {
  it('keeps a width inside the limits', () => {
    expect(clampActionPanelWidth(384)).toBe(384);
  });

  it('clamps below the minimum up to it', () => {
    expect(clampActionPanelWidth(100)).toBe(ACTION_PANEL_MIN_WIDTH_PX);
  });

  it('clamps above the maximum down to it', () => {
    expect(clampActionPanelWidth(1200)).toBe(ACTION_PANEL_MAX_WIDTH_PX);
  });
});

describe('actionPanelWidthForKey', () => {
  it('grows the panel on ArrowLeft and shrinks it on ArrowRight', () => {
    expect(actionPanelWidthForKey(384, 'ArrowLeft', false)).toBe(400);
    expect(actionPanelWidthForKey(384, 'ArrowRight', false)).toBe(368);
  });

  it('moves 64 px with Shift', () => {
    expect(actionPanelWidthForKey(384, 'ArrowLeft', true)).toBe(448);
  });

  it('never leaves the limits', () => {
    expect(actionPanelWidthForKey(ACTION_PANEL_MIN_WIDTH_PX, 'ArrowRight', false)).toBe(
      ACTION_PANEL_MIN_WIDTH_PX,
    );
    expect(actionPanelWidthForKey(ACTION_PANEL_MAX_WIDTH_PX, 'ArrowLeft', true)).toBe(
      ACTION_PANEL_MAX_WIDTH_PX,
    );
  });

  it('jumps to the limits on Home and End', () => {
    expect(actionPanelWidthForKey(384, 'Home', false)).toBe(ACTION_PANEL_MIN_WIDTH_PX);
    expect(actionPanelWidthForKey(384, 'End', false)).toBe(ACTION_PANEL_MAX_WIDTH_PX);
  });

  it('ignores other keys', () => {
    expect(actionPanelWidthForKey(384, 'a', false)).toBeUndefined();
  });

  it('defaults to the open panel width', () => {
    expect(ACTION_PANEL_DEFAULT_WIDTH_PX).toBe(384);
  });
});
