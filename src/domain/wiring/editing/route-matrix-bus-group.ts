import { createEntityId } from '@domain/project';
import { getWirePath } from '@domain/wires/geometry';
import type { Project, Result, RoutingSettings, Wire, WiringProposalSummary } from '@domain';
import type { MatrixBusRoute } from './matrix-bus-types';
import { createBusTrunk, shiftMatrixBus, equalPoints } from './matrix-bus-wires';
import { getRoutingSegments, getForeignPins } from './routing-segments';
import { createRouteSegmentIndex } from './route-segment-index';
import { checkRouteCandidate } from './check-route-candidate';
import { findSymmetricRoute } from './find-symmetric-route';
import type { SymmetricRouteInput } from './symmetric-route-types';

type GroupResult = {
  readonly wires: readonly Wire[];
  readonly warnings: WiringProposalSummary['warnings'];
};
type Context = {
  readonly settings: RoutingSettings;
  readonly existingIds: readonly string[];
  readonly original: MatrixBusRoute;
};

export function routeMatrixBusGroup(
  project: Project,
  route: MatrixBusRoute,
  context: Context,
): Result<GroupResult, string> {
  const input = routingInput(project, route, context);
  const nearby = createRouteSegmentIndex(
    input.obstacles.filter(
      (segment) => segment.half === route.half && segment.netId !== route.terminalId,
    ),
  );
  let reason = 'Fixed contacts or parallel clearance prevent this bus.';
  for (let attempt = 0; attempt <= 64; attempt += 1) {
    const shifted = shiftMatrixBus(route, {
      attempt,
      step: Math.max(input.clearanceU, input.offsetU),
    });
    if (shifted.branches.some((branch) => branch.requiresDetour)) {
      continue;
    }
    const branches = tryBusGroup(project, shifted, { input, nearby, context });
    if (!branches.ok) {
      reason = branches.error;
      continue;
    }
    return acceptedGroup(route, branches.value, attempt);
  }
  return {
    ok: false,
    error: `${reason} No valid bus after 64 outward shifts; unlock or move the blocking objects.`,
  };
}

function routeBranches(
  route: MatrixBusRoute,
  context: {
    readonly input: SymmetricRouteInput;
    readonly trunk: Wire;
    readonly existingIds: readonly string[];
  },
): Result<{ readonly wires: readonly Wire[]; readonly deviated: boolean }, string> {
  const wires = [context.trunk];
  const existingIds = [...context.existingIds, context.trunk.id];
  let deviated = false;
  for (const branch of route.branches) {
    if (equalPoints({ first: branch.pinAt, second: branch.busAt })) {
      continue;
    }
    const points =
      branch.pinAt.xU === branch.busAt.xU || branch.pinAt.yU === branch.busAt.yU
        ? [branch.pinAt, branch.busAt]
        : [branch.pinAt, { xU: branch.pinAt.xU, yU: branch.busAt.yU }, branch.busAt];
    const found = findSymmetricRoute({ ...context.input, points });
    if (!found.ok) {
      return { ok: false, error: `Cannot route key ${branch.keyId}: ${found.error.message}` };
    }
    const id = createEntityId({ prefix: 'w', existingIds });
    existingIds.push(id);
    deviated ||= found.value.strategy !== 'preferred';
    wires.push({
      id,
      half: route.half,
      start: { kind: 'key-pin', keyId: branch.keyId, pin: branch.pin },
      end: { kind: 'junction', wireId: context.trunk.id, at: branch.busAt },
      bends: found.value.points.slice(1, -1),
    });
  }
  return { ok: true, value: { wires, deviated } };
}

function routingInput(
  project: Project,
  route: MatrixBusRoute,
  context: Context,
): SymmetricRouteInput {
  return {
    points: route.line,
    half: route.half,
    netId: route.terminalId,
    outward: route.half === 'right' ? 'right' : 'left',
    clearanceU: context.settings.clearanceU,
    offsetU: context.settings.offsetU,
    obstacles: getRoutingSegments(project),
    forbiddenPoints: getForeignPins(project, context.original),
  };
}

function tryBusGroup(
  project: Project,
  route: MatrixBusRoute,
  search: {
    readonly input: SymmetricRouteInput;
    readonly nearby: ReturnType<typeof createRouteSegmentIndex>;
    readonly context: Context;
  },
): ReturnType<typeof routeBranches> {
  const id = createEntityId({ prefix: 'w', existingIds: search.context.existingIds });
  const trunk = createBusTrunk(project, { route, id, settings: search.context.settings });
  if (!trunk.ok) {
    return trunk;
  }
  const checked = checkRouteCandidate(
    getWirePath(project, trunk.value),
    search.input,
    search.nearby,
  );
  if (checked.blockingIds.length > 0) {
    return {
      ok: false,
      error: `Bus ${route.terminalId} is blocked by ${checked.blockingIds.join(', ')}.`,
    };
  }
  return routeBranches(route, {
    input: search.input,
    trunk: trunk.value,
    existingIds: search.context.existingIds,
  });
}

function acceptedGroup(
  route: MatrixBusRoute,
  result: { readonly wires: readonly Wire[]; readonly deviated: boolean },
  attempt: number,
): Result<GroupResult, string> {
  const warnings =
    attempt > 0 || result.deviated
      ? [
          {
            message: `Bus ${route.terminalId} uses an obstacle-avoiding route; preferred symmetry was adjusted.`,
            wireIds: result.wires.map((wire) => wire.id),
            keyIds: route.branches.map((branch) => branch.keyId),
          },
        ]
      : [];
  return { ok: true, value: { wires: result.wires, warnings } };
}
