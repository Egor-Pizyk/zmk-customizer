import type { WirePoint } from '@domain';

export function getPointerRotationDeg(input: {
  readonly center: WirePoint;
  readonly start: WirePoint;
  readonly position: WirePoint;
  readonly initialRotationDeg: number;
}): number | undefined {
  const { center, start, position, initialRotationDeg } = input;
  if (
    Math.hypot(position.xU - center.xU, position.yU - center.yU) < 1e-8 ||
    Math.hypot(start.xU - center.xU, start.yU - center.yU) < 1e-8
  ) {
    return undefined;
  }
  const from = Math.atan2(start.yU - center.yU, start.xU - center.xU);
  const to = Math.atan2(position.yU - center.yU, position.xU - center.xU);
  const delta = ((((((to - from) * 180) / Math.PI + 180) % 360) + 360) % 360) - 180;
  return initialRotationDeg + delta;
}
