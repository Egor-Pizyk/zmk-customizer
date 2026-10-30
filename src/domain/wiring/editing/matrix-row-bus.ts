import { getKeyCenter, roundU } from '@domain/geometry';
import type { RoutingSettings, WirePoint } from '@domain';
import { getIdentity, sortedMembers, getRange } from './matrix-bus-order';
import type {
  MatrixBusRoute,
  MatrixBusGroup,
  MatrixBusMember,
  MatrixBusBranch,
} from './matrix-bus-types';

export function createPreferredRowBus(
  group: MatrixBusGroup,
  groups: readonly MatrixBusGroup[],
  settings: RoutingSettings,
): MatrixBusRoute {
  const center = getRowCenter(group);
  const heights = [
    ...new Set(
      groups
        .filter((entry) => entry.kind === 'row' && entry.half === group.half)
        .map((entry) => getRowCenter(entry)),
    ),
  ].toSorted((first, second) => first - second);
  const yU = getBusY({ center, heights, fallback: settings.fallbackRowIntervalU });
  return {
    ...getIdentity(group),
    line: getRowLine(group, { yU, offsetU: settings.offsetU }),
    branches: sortedMembers(group).map((member) => createBranch(member, yU)),
  };
}

function getRowCenter(group: MatrixBusGroup): number {
  const values = group.members
    .map((member) => roundU(getKeyCenter(member.key).yU))
    .toSorted((first, second) => first - second);
  const middle = Math.floor(values.length / 2);
  return roundU(
    values.length % 2 === 0
      ? ((values[middle - 1] ?? 0) + (values[middle] ?? 0)) / 2
      : (values[middle] ?? 0),
  );
}

function getBusY({
  center,
  heights,
  fallback,
}: {
  readonly center: number;
  readonly heights: readonly number[];
  readonly fallback: number;
}): number {
  const above = heights.findLast((height) => height < center);
  const interval =
    heights.length < 2
      ? fallback
      : ((heights.at(-1) ?? center) - (heights[0] ?? center)) / (heights.length - 1);
  return roundU(above === undefined ? center - interval / 2 : (center + above) / 2);
}

function getRowLine(
  group: MatrixBusGroup,
  { yU, offsetU }: { readonly yU: number; readonly offsetU: number },
): readonly [WirePoint, WirePoint] {
  const xs = group.members.map((member) => member.at.xU);
  const { min, max } = getRange(xs);
  return group.half === 'right'
    ? [
        { xU: min, yU },
        { xU: roundU(max + offsetU), yU },
      ]
    : [
        { xU: roundU(min - offsetU), yU },
        { xU: max, yU },
      ];
}

function createBranch(member: MatrixBusMember, yU: number): MatrixBusBranch {
  return {
    keyId: member.key.id,
    pin: member.pin,
    pinAt: member.at,
    busAt: { xU: member.at.xU, yU },
    requiresDetour: yU >= member.at.yU,
  };
}
