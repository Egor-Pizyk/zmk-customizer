import { roundU } from '@domain/geometry';
import type { Result, WirePoint } from '@domain';
import type {
  RouteSearchFailure,
  SymmetricRouteInput,
  SymmetricRoute,
} from './symmetric-route-types';
import { createRouteSegmentIndex } from './route-segment-index';
import { checkRouteCandidate } from './check-route-candidate';
import { detourCandidate, outwardCandidate, simplifyRoute } from './symmetric-route-candidates';

/** Bounded single-span search. Full electrical equivalence and insulation materialization remain caller obligations. */
export function findSymmetricRoute(
  input: SymmetricRouteInput,
): Result<SymmetricRoute, RouteSearchFailure> {
  if (!validInput(input)) {
    return refused('route-invalid', []);
  }
  const nearby = createRouteSegmentIndex(
    input.obstacles.filter(
      (segment) => segment.half === input.half && segment.netId !== input.netId,
    ),
  );
  const blocked = new Set<string>();
  for (const strategy of ['preferred', 'outward', 'detour'] as const) {
    const count = SEARCH_COUNTS[strategy];
    for (let index = 0; index < count; index += 1) {
      const points = candidate(input, strategy, index);
      if (!points.every((point) => finitePoint(point))) {
        continue;
      }
      const checked = checkRouteCandidate(points, input, nearby);
      if (checked.blockingIds.length === 0) {
        return {
          ok: true,
          value: { points, strategy, insulatedCrossings: checked.insulatedCrossings },
        };
      }
      for (const id of checked.blockingIds) {
        blocked.add(id);
      }
    }
  }
  return refused('route-impossible', [...blocked].toSorted());
}

function validInput(input: SymmetricRouteInput): boolean {
  const first = input.points[0];
  return (
    first !== undefined &&
    input.points.length >= 2 &&
    input.points.some((point) => point.xU !== first.xU || point.yU !== first.yU) &&
    [input.clearanceU, input.offsetU].every(
      (value) => Number.isFinite(value) && roundU(value) > 0,
    ) &&
    input.points.every(
      (point, index) =>
        finitePoint(point) &&
        (index === 0 || orthogonal({ first: point, second: input.points[index - 1] })),
    ) &&
    input.obstacles.every(
      (segment) =>
        finitePoint(segment.from) &&
        finitePoint(segment.to) &&
        orthogonal({ first: segment.from, second: segment.to }),
    ) &&
    (input.forbiddenPoints ?? []).every((point) => finitePoint(point))
  );
}

function finitePoint(point: WirePoint): boolean {
  return Number.isFinite(point.xU) && Number.isFinite(point.yU);
}

function orthogonal({
  first,
  second,
}: {
  readonly first: WirePoint;
  readonly second: WirePoint | undefined;
}): boolean {
  return second !== undefined && (first.xU === second.xU || first.yU === second.yU);
}

const SEARCH_COUNTS = { preferred: 1, outward: 64, detour: 128 } as const;

function candidate(
  input: SymmetricRouteInput,
  strategy: SymmetricRoute['strategy'],
  index: number,
): readonly WirePoint[] {
  if (strategy === 'preferred') {
    return simplifyRoute(input.points);
  }
  return strategy === 'outward' ? outwardCandidate(input, index) : detourCandidate(input, index);
}

function refused(
  code: RouteSearchFailure['code'],
  blockingIds: readonly string[],
): Result<never, RouteSearchFailure> {
  return {
    ok: false,
    error: {
      code,
      blockingIds,
      message:
        code === 'route-invalid'
          ? 'Routing requires finite orthogonal spans and positive spacing.'
          : 'No route satisfies the fixed contacts and clearance.',
      attempts: code === 'route-invalid' ? { preferred: 0, outward: 0, detour: 0 } : SEARCH_COUNTS,
    },
  };
}
