import { getWirePath } from '@domain/wires/geometry';
import { moveKey } from '@domain/keys';
import type { WirePoint } from '@domain';
import { expect, it } from 'vitest';

import { buildProject, freeEnd, keyPin } from '../../../../helpers/build-project';

function isOrthogonal(path: readonly WirePoint[]): boolean {
  return path.every((point, index) => {
    const next = path[index + 1];
    return next === undefined || next.xU === point.xU || next.yU === point.yU;
  });
}

const KEYS = [
  { id: 'k1', xU: 0, yU: 0 },
  { id: 'k2', xU: 2, yU: 1 },
];

it('inserts one horizontal-first corner between points that are not in line', () => {
  const wire = { id: 'w1', start: freeEnd(0, 0), end: keyPin('k2', 1), bends: [] };
  const path = getWirePath(buildProject({ keys: KEYS, wires: [wire] }), wire);
  expect(path).toEqual([
    { xU: 0, yU: 0 },
    { xU: 2.3, yU: 0 },
    { xU: 2.3, yU: 1.3667 },
  ]);
});

it('keeps every segment orthogonal through bends and follows a moved key', () => {
  const wire = {
    id: 'w1',
    start: keyPin('k1', 2),
    end: keyPin('k2', 1),
    bends: [
      { xU: 1, yU: 3 },
      { xU: 1.5, yU: 0.5 },
    ],
  };
  const project = buildProject({ keys: KEYS, wires: [wire] });
  expect(isOrthogonal(getWirePath(project, wire))).toBe(true);
  const moved = moveKey(project, { keyId: 'k2', position: { xU: 5, yU: 4 } });
  const path = getWirePath(moved, wire);
  expect(isOrthogonal(path)).toBe(true);
  expect(path.at(-1)).toEqual({ xU: 5.3, yU: 4.3667 });
});

it('draws a junction end at the nearest point of the target wire', () => {
  const target = { id: 'w1', start: freeEnd(0, 2), end: freeEnd(4, 2), bends: [] };
  const branch = {
    id: 'w2',
    start: keyPin('k2', 1),
    end: { kind: 'junction', wireId: 'w1', at: { xU: 2.3, yU: 1.9 } } as const,
    bends: [],
  };
  const project = buildProject({ keys: KEYS, wires: [target, branch] });
  expect(getWirePath(project, branch).at(-1)).toEqual({ xU: 2.3, yU: 2 });
});

it('drops repeated points', () => {
  const wire = { id: 'w1', start: freeEnd(1, 1), end: freeEnd(1, 3), bends: [{ xU: 1, yU: 1 }] };
  expect(getWirePath(buildProject({ wires: [wire] }), wire)).toEqual([
    { xU: 1, yU: 1 },
    { xU: 1, yU: 3 },
  ]);
});
