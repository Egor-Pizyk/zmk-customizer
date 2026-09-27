import type { ScreenPoint } from './viewport';

// Read at action time instead of tracking size with a ResizeObserver: the value is only needed
// when a zoom button or shortcut fires.
export function surfaceCenter(element: Element | null): ScreenPoint {
  const bounds = element?.getBoundingClientRect();
  return { xPx: (bounds?.width ?? 0) / 2, yPx: (bounds?.height ?? 0) / 2 };
}
