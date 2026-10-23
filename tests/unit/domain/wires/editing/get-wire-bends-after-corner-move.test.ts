import { getWireBendsAfterCornerMove } from '@domain/wires/editing';
import { getWirePath } from '@domain/wires/geometry';
import type { WirePoint } from '@domain';
import { expect, it } from 'vitest';
import { buildProject, freeEnd } from '../../../../helpers/build-project';
import { getDefinedValue } from '../../../../helpers/defined-value';

it.each([1, -1])('expands a corner without backtracking in direction %s', (direction) => {
  const transform = (point: WirePoint): WirePoint => ({
    xU: point.xU * direction + 0,
    yU: point.yU * direction + 0,
  });
  const bends = [
    { xU: 2, yU: 4 },
    { xU: 2, yU: 2 },
    { xU: 6, yU: 2 },
  ].map((point) => transform(point));
  const project = buildProject({
    wires: [{ id: 'w1', start: freeEnd(0, 4 * direction), end: freeEnd(6 * direction, 0), bends }],
  });
  const wire = getDefinedValue(project.wires[0]);
  const moved = getWireBendsAfterCornerMove(project, {
    wire,
    bendIndex: 1,
    point: transform({ xU: 1, yU: 1 }),
  });
  expect(getWirePath(project, { ...wire, bends: moved })).toEqual(
    [
      { xU: 0, yU: 4 },
      { xU: 1, yU: 4 },
      { xU: 1, yU: 1 },
      { xU: 6, yU: 1 },
      { xU: 6, yU: 0 },
    ].map((point) => transform(point)),
  );
});

it('keeps contact anchors fixed while expanding the editable path', () => {
  const project = buildProject({
    wires: [
      {
        id: 'w1',
        start: freeEnd(0, 5),
        end: freeEnd(7, 0),
        anchors: { start: { xU: 0, yU: 4 }, end: { xU: 6, yU: 0 } },
        bends: [
          { xU: 2, yU: 4 },
          { xU: 2, yU: 2 },
          { xU: 6, yU: 2 },
        ],
      },
    ],
  });
  const wire = getDefinedValue(project.wires[0]);
  const moved = getWireBendsAfterCornerMove(project, {
    wire,
    bendIndex: 1,
    point: { xU: 1, yU: 1 },
  });
  expect(getWirePath(project, { ...wire, bends: moved })).toEqual([
    { xU: 0, yU: 5 },
    { xU: 0, yU: 4 },
    { xU: 1, yU: 4 },
    { xU: 1, yU: 1 },
    { xU: 6, yU: 1 },
    { xU: 6, yU: 0 },
    { xU: 7, yU: 0 },
  ]);
});

it('preserves horizontal-to-vertical orientation at a moved automatic corner', () => {
  const project = buildProject({
    wires: [{ id: 'w1', start: freeEnd(0, 0), end: freeEnd(4, 2), bends: [{ xU: 4, yU: 0 }] }],
  });
  const wire = getDefinedValue(project.wires[0]);
  const moved = getWireBendsAfterCornerMove(project, {
    wire,
    bendIndex: 0,
    point: { xU: 3, yU: 1 },
  });
  expect(getWirePath(project, { ...wire, bends: moved })).toEqual([
    { xU: 0, yU: 0 },
    { xU: 0, yU: 1 },
    { xU: 3, yU: 1 },
    { xU: 3, yU: 2 },
    { xU: 4, yU: 2 },
  ]);
});
