import type { WirePoint } from './types';

export function rotatePoint(
  point: WirePoint,
  input: { readonly rotationDeg: number; readonly origin: WirePoint },
): WirePoint {
  const radians = (input.rotationDeg * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const deltaXU = point.xU - input.origin.xU;
  const deltaYU = point.yU - input.origin.yU;
  return {
    xU: input.origin.xU + deltaXU * cosine - deltaYU * sine,
    yU: input.origin.yU + deltaXU * sine + deltaYU * cosine,
  };
}
