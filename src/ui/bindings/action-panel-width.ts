// Width limits for the resizable Bindings Action panel (docked right, dragged by its left
// edge). The stored preference is clamped on load and on every change, so a damaged value
// falls back instead of collapsing the panel.
export const ACTION_PANEL_DEFAULT_WIDTH_PX = 384;
export const ACTION_PANEL_MIN_WIDTH_PX = 240;
export const ACTION_PANEL_MAX_WIDTH_PX = 640;

const KEYBOARD_STEP_PX = 16;
const LARGE_KEYBOARD_STEP_PX = 64;

const DELTA_BY_KEY: Readonly<Record<string, number>> = {
  ArrowLeft: 1,
  ArrowRight: -1,
};

export function clampActionPanelWidth(widthPx: number): number {
  return Math.max(ACTION_PANEL_MIN_WIDTH_PX, Math.min(widthPx, ACTION_PANEL_MAX_WIDTH_PX));
}

// Arrow keys resize by the same steps as the floating tool window (16 px, 64 px with Shift);
// Home/End jump to the limits. Anything else is not a resize key.
export function actionPanelWidthForKey(
  widthPx: number,
  key: string,
  isShift: boolean,
): number | undefined {
  if (key === 'Home') {
    return ACTION_PANEL_MIN_WIDTH_PX;
  }
  if (key === 'End') {
    return ACTION_PANEL_MAX_WIDTH_PX;
  }
  const direction = DELTA_BY_KEY[key];
  if (direction === undefined) {
    return undefined;
  }
  const stepPx = isShift ? LARGE_KEYBOARD_STEP_PX : KEYBOARD_STEP_PX;
  return clampActionPanelWidth(widthPx + direction * stepPx);
}
