import {
  getWireConductors,
  getKeyPinPosition,
  getWirePinContacts,
  getWireHalf,
} from '@domain/wires/geometry';
import type { ElectricalRoutingPath } from '@domain/wires/nets';
import type { Project, Result, RoutingSettings, Wire, WirePoint } from '@domain';
import { findSymmetricRoute } from './find-symmetric-route';
import { simplifyRoute } from './symmetric-route-candidates';
import type { RoutingSegment, SymmetricRouteInput } from './symmetric-route-types';

type Segment = RoutingSegment & { readonly wireId: string };
type Input = {
  readonly path: ElectricalRoutingPath;
  readonly settings: RoutingSettings;
  readonly segments: readonly Segment[];
};

export function prettifySpine(project: Project, wire: Wire, input: Input): Result<Wire, string> {
  const sites = input.path.sites.map((site) => site.at);
  const netId = input.segments.find((segment) => segment.wireId === wire.id)?.netId;
  if (netId === undefined || sites.length < 2) {
    return { ok: true, value: wire };
  }
  const half = getWireHalf(project, wire);
  const forbiddenPoints = foreignPins(project, wire);
  const points: WirePoint[] = [];
  for (const [index, from] of sites.entries()) {
    const to = sites[index + 1];
    if (to === undefined) {
      break;
    }
    if (from.xU === to.xU && from.yU === to.yU) {
      continue;
    }
    const found = routeSpan(
      { from, to },
      {
        half,
        netId,
        outward: half === 'right' ? 'right' : 'left',
        clearanceU: input.settings.clearanceU,
        offsetU: input.settings.offsetU,
        obstacles: input.segments,
        forbiddenPoints,
      },
    );
    if (!found.ok) {
      return { ok: false, error: `Cannot optimize wire ${wire.id}: ${found.error}` };
    }
    points.push(...found.value);
  }
  return withPrettifiedPath(wire, points);
}

function withPrettifiedPath(wire: Wire, points: readonly WirePoint[]): Result<Wire, string> {
  const path = simplifyRoute(points);
  const start = path[0];
  const end = path.at(-1);
  if (start === undefined || end === undefined) {
    return { ok: true, value: wire };
  }
  const candidate: Wire = {
    ...wire,
    bends: path.slice(1, -1),
    ...(wire.anchors === undefined ? {} : { anchors: { start, end } }),
  };
  return { ok: true, value: JSON.stringify(candidate) === JSON.stringify(wire) ? wire : candidate };
}

export function replaceRoutingSegments(
  project: Project,
  input: {
    readonly wire: Wire;
    readonly segments: readonly Segment[];
  },
): readonly Segment[] {
  const previous = input.segments.find((segment) => segment.wireId === input.wire.id);
  if (previous === undefined) {
    return input.segments;
  }
  const replacements = getWireConductors(project, input.wire).flatMap((path, pathIndex) =>
    path.slice(1).map((to, index) => ({
      id: `${input.wire.id}:${pathIndex}:${index}`,
      wireId: input.wire.id,
      netId: previous.netId,
      half: previous.half,
      from: path[index] ?? to,
      to,
    })),
  );
  return [...input.segments.filter((segment) => segment.wireId !== input.wire.id), ...replacements];
}

function foreignPins(project: Project, wire: Wire): readonly WirePoint[] {
  const own = new Set(
    [wire.start, wire.end, ...getWirePinContacts(project, wire)].flatMap((end) =>
      'keyId' in end ? [`${end.keyId}:${end.pin}`] : [],
    ),
  );
  const half = getWireHalf(project, wire);
  return project.keys
    .filter((key) => (key.half ?? 'left') === half)
    .flatMap((key) =>
      ([1, 2] as const)
        .filter((pin) => !own.has(`${key.id}:${pin}`))
        .map((pin) => getKeyPinPosition(key, pin)),
    );
}

function routeSpan(
  { from, to }: { readonly from: WirePoint; readonly to: WirePoint },
  input: Omit<SymmetricRouteInput, 'points'>,
): Result<readonly WirePoint[], string> {
  const points =
    from.xU === to.xU || from.yU === to.yU ? [from, to] : [from, { xU: to.xU, yU: from.yU }, to];
  const found = findSymmetricRoute({ ...input, points });
  return found.ok
    ? { ok: true, value: found.value.points }
    : { ok: false, error: found.error.message };
}
