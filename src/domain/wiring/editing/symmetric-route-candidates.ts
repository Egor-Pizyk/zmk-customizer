import { roundU } from '@domain/geometry';
import type { WirePoint } from '@domain';
import type { SymmetricRouteInput } from './symmetric-route-types';

export function outwardCandidate(input: SymmetricRouteInput, index: number): readonly WirePoint[] {
  const start = input.points[0];
  const end = input.points.at(-1);
  if (start === undefined || end === undefined) {
    return [];
  }
  const step = roundU(Math.max(input.offsetU, input.clearanceU) * (index + 1));
  const dx = input.outward === 'left' ? -step : Number(input.outward === 'right') * step;
  const dy = input.outward === 'up' ? -step : Number(input.outward === 'down') * step;
  return simplifyRoute([
    start,
    ...input.points.map((point) => ({
      xU: roundU(point.xU + dx),
      yU: roundU(point.yU + dy),
    })),
    end,
  ]);
}

export function detourCandidate(input: SymmetricRouteInput, index: number): readonly WirePoint[] {
  const start = input.points[0];
  const end = input.points.at(-1);
  if (start === undefined || end === undefined) {
    return [];
  }
  const step = roundU(Math.max(input.offsetU, input.clearanceU) * (Math.floor(index / 4) + 1));
  const side = index % 4;
  const sign =
    (input.outward === 'left' || input.outward === 'up' ? -1 : 1) * (side % 2 === 0 ? 1 : -1);
  const xU = roundU(
    (sign < 0 ? Math.min(start.xU, end.xU) : Math.max(start.xU, end.xU)) + sign * step,
  );
  const yU = roundU(
    (sign < 0 ? Math.min(start.yU, end.yU) : Math.max(start.yU, end.yU)) + sign * step,
  );
  const horizontal = input.outward === 'left' || input.outward === 'right';
  return simplifyRoute(
    side < 2 === horizontal
      ? [start, { xU, yU: start.yU }, { xU, yU: end.yU }, end]
      : [start, { xU: start.xU, yU }, { xU: end.xU, yU }, end],
  );
}

export function simplifyRoute(points: readonly WirePoint[]): readonly WirePoint[] {
  const result: WirePoint[] = [];
  for (const point of points) {
    const last = result.at(-1);
    if (last?.xU === point.xU && last.yU === point.yU) {
      continue;
    }
    const before = result.at(-2);
    if (
      before !== undefined &&
      last !== undefined &&
      ((before.xU === last.xU &&
        last.xU === point.xU &&
        between({ value: last.yU, start: before.yU, end: point.yU })) ||
        (before.yU === last.yU &&
          last.yU === point.yU &&
          between({ value: last.xU, start: before.xU, end: point.xU })))
    ) {
      result.pop();
    }
    result.push(point);
  }
  return result;
}

function between({
  value,
  start,
  end,
}: {
  readonly value: number;
  readonly start: number;
  readonly end: number;
}): boolean {
  return value >= Math.min(start, end) && value <= Math.max(start, end);
}
