export type PanelPosition = {
  readonly xPx: number;
  readonly yPx: number;
};

export type PanelSize = {
  readonly widthPx: number;
  readonly heightPx: number;
};

const STEP_PX = 16;
const LARGE_STEP_PX = 64;

const DIRECTION_BY_KEY: Readonly<Record<string, PanelPosition>> = {
  ArrowLeft: { xPx: -1, yPx: 0 },
  ArrowRight: { xPx: 1, yPx: 0 },
  ArrowUp: { xPx: 0, yPx: -1 },
  ArrowDown: { xPx: 0, yPx: 1 },
};

function clampAxis(valuePx: number, panelPx: number, containerPx: number): number {
  return Math.max(0, Math.min(valuePx, containerPx - panelPx));
}

// Nearest position that keeps the whole panel inside the container; 0 when it cannot fit.
export function clampPanelPosition(
  position: PanelPosition,
  panelSize: PanelSize,
  containerSize: PanelSize,
): PanelPosition {
  return {
    xPx: clampAxis(position.xPx, panelSize.widthPx, containerSize.widthPx),
    yPx: clampAxis(position.yPx, panelSize.heightPx, containerSize.heightPx),
  };
}

export function panelPositionForKey(
  position: PanelPosition,
  key: string,
  isShift: boolean,
): PanelPosition | undefined {
  const direction = DIRECTION_BY_KEY[key];
  if (direction === undefined) {
    return undefined;
  }
  const stepPx = isShift ? LARGE_STEP_PX : STEP_PX;
  return { xPx: position.xPx + direction.xPx * stepPx, yPx: position.yPx + direction.yPx * stepPx };
}
