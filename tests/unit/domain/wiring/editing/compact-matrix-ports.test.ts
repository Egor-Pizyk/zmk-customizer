import { expect, it } from 'vitest';
import { getControllerBoard } from '@catalog/controllers';
import { ZMK_LIMITS } from '@catalog/firmware';
import { regenerateWiring } from '@domain/wiring/editing';
import { getRoutingSettings } from '@domain/wiring';
import { getNets } from '@domain/wires/nets';
import { getWirePath } from '@domain/wires/geometry';
import type { Project, Wire, Key } from '@domain';
import { buildProject } from '../../../../helpers/build-project';
import { getResultValue } from '../../../../helpers/result';

it('uses symmetric buses only for a new empty project without saved routing settings', () => {
  const empty = grid();
  expect(getRoutingSettings(empty).matrixStyle).toBe('symmetric-bus');
  const existing = {
    ...empty,
    wires: [
      {
        id: 'w0',
        start: { kind: 'key-pin', keyId: 'k0', pin: 1 },
        end: { kind: 'free', at: { xU: -1, yU: 0.3667 } },
        bends: [],
      },
    ],
  } as const;
  expect(getRoutingSettings(existing).matrixStyle).toBe('existing');
  expect(
    getRoutingSettings({
      ...empty,
      routing: { ...getRoutingSettings(empty), matrixStyle: 'existing' },
    }).matrixStyle,
  ).toBe('existing');
});

it('places three row roots on a common outer line and three straight column roots over their pins', () => {
  const candidate = route(grid());
  expect(ports(candidate, 'row')).toEqual([
    { xU: -2.5, yU: 0 },
    { xU: -2.5, yU: 1 },
    { xU: -2.5, yU: 2 },
  ]);
  expect(ports(candidate, 'col')).toEqual([
    { xU: 0.6333, yU: -0.5 },
    { xU: 1.6333, yU: -0.5 },
    { xU: 2.6333, yU: -0.5 },
  ]);
  for (const wire of roots(candidate, 'col')) {
    expect(new Set(getWirePath(candidate, wire).map((point) => point.xU)).size).toBe(1);
    expect(wire.bends).toEqual([]);
  }
  expect(
    getNets(candidate)
      .map((net) => net.pins.length)
      .toSorted((first, second) => first - second),
  ).toEqual([3, 3, 3, 3, 3, 3]);
  expect(getNets(candidate).every((net) => net.terminalIds.length === 1)).toBe(true);
  for (const key of candidate.keys) {
    expect(key.diode).toEqual({ pin: 1, cathode: 'away-switch' });
  }
  expect(candidate.insulatedCrossings.length).toBeGreaterThan(0);
  expect(candidate.wiring?.terminals.map((terminal) => terminal.boardPin)).toEqual([
    0, 1, 2, 3, 4, 5,
  ]);
});

it('mirrors row output padding and keeps a common top line for split halves', () => {
  const left = grid().keys.map(leftKey);
  const right = grid().keys.map(rightKey);
  const candidate = route(buildProject({ keys: [...left, ...right] }));
  expect(ports(candidate, 'row').map((point) => point.xU)).toEqual([
    -2.5, -2.5, -2.5, 13.5, 13.5, 13.5,
  ]);
  expect(ports(candidate, 'col').map((point) => point.yU)).toEqual([
    -0.5, -0.5, -0.5, -0.5, -0.5, -0.5,
  ]);
});

it('keeps straight columns above the top row bus for a widely spaced grid', () => {
  const candidate = route({ ...grid(), keys: grid().keys.map(spacedKey) });
  expect(ports(candidate, 'col')).toEqual([
    { xU: 0.6333, yU: -1 },
    { xU: 2.6333, yU: -1 },
    { xU: 4.6333, yU: -1 },
  ]);
});

it('derives compact output bounds from the actual rotated nonstandard key', () => {
  const candidate = route(
    buildProject({
      keys: [
        {
          id: 'k0',
          xU: 0,
          yU: 0,
          widthU: 2,
          rotationDeg: 90,
          rotationOriginXU: 1,
          rotationOriginYU: 0.5,
        },
      ],
    }),
  );
  expect(ports(candidate, 'row')).toEqual([{ xU: -2, yU: 0 }]);
  expect(ports(candidate, 'col')).toEqual([{ xU: 1.2667, yU: -1 }]);
});

it('retains an existing protected output instead of shortening it implicitly', () => {
  const first = route(grid());
  const locked = { ...first, wires: first.wires.map(lockFirstRoot) };
  const result = route(locked);
  expect(result.wires).toContainEqual(locked.wires[0]);
});

function lockFirstRoot(wire: Wire, index: number): Wire {
  if (index !== 0) {
    return wire;
  }
  if (wire.start.kind !== 'free' || wire.end.kind !== 'free') {
    throw new Error('Expected row root fixture.');
  }
  const at = { xU: -4, yU: 0 };
  return {
    ...wire,
    locked: true,
    start: { ...wire.start, at },
    anchors: { start: at, end: wire.end.at },
  };
}

function grid(): Project {
  return buildProject({
    keys: Array.from({ length: 9 }, (_, index) => ({
      id: `k${index}`,
      xU: index % 3,
      yU: Math.floor(index / 3),
    })),
  });
}
function route(project: Project): Project {
  return getResultValue(
    regenerateWiring(project, {
      board: getControllerBoard(project.controllerId),
      settings: { ...getRoutingSettings(project), matrixStyle: 'symmetric-bus' },
      limits: ZMK_LIMITS,
      scope: { kind: 'all' },
    }),
  ).project;
}
function roots(project: Project, kind: 'row' | 'col'): readonly Wire[] {
  const ids =
    project.wiring?.terminals
      .filter((terminal) => terminal.kind === kind)
      .map((terminal) => terminal.id) ?? [];
  return project.wires.filter(
    (wire) => wire.start.kind === 'free' && ids.includes(wire.start.terminalId ?? ''),
  );
}
function ports(project: Project, kind: 'row' | 'col') {
  return roots(project, kind).flatMap((wire) =>
    wire.start.kind === 'free' ? [wire.start.at] : [],
  );
}

function leftKey(key: Key): Key {
  return { ...key, half: 'left' };
}
function spacedKey(key: Key): Key {
  return { ...key, xU: key.xU * 2, yU: key.yU * 2 };
}
function rightKey(key: Key, index: number): Key {
  return { ...key, id: `k${index + 9}`, xU: key.xU + 8, half: 'right' };
}
