import type { MatrixBusGroup as Group, MatrixBusMember as Member } from './matrix-bus-types';

export function getIdentity({ terminalId, half, kind, index }: Group) {
  return { terminalId, half, kind, index };
}
export function sortedMembers(group: Group): readonly Member[] {
  return group.members.toSorted((first, second) => {
    const delta =
      group.kind === 'row'
        ? (first.at.xU - second.at.xU) * (group.half === 'right' ? -1 : 1)
        : first.at.yU - second.at.yU;
    if (delta !== 0) {
      return delta;
    }
    if (first.key.id === second.key.id) {
      return 0;
    }
    return first.key.id < second.key.id ? -1 : 1;
  });
}
export function compareGroups(first: Group, second: Group): number {
  if (first.half !== second.half) {
    return first.half === 'left' ? -1 : 1;
  }
  if (first.kind !== second.kind) {
    return first.kind === 'row' ? -1 : 1;
  }
  return first.index - second.index;
}

export function getRange(values: readonly number[]): {
  readonly min: number;
  readonly max: number;
} {
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  return { min, max };
}
