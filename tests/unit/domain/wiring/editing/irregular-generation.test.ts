import { expect, it } from 'vitest';
import { getControllerBoard } from '@catalog/controllers';
import { ZMK_LIMITS } from '@catalog/firmware';
import { regenerateWiring } from '@domain/wiring/editing';
import { getWiringCells } from '@domain/wiring/matrix';
import { validateWireProtection } from '@domain/wires/protection';
import type { Key, Project, Wire } from '@domain';
import { buildProject } from '../../../../helpers/build-project';
import { getResultValue } from '../../../../helpers/result';

const INPUT = {
  board: getControllerBoard('nice_nano_v2'),
  limits: ZMK_LIMITS,
  scope: { kind: 'all' },
  settings: {
    matrixStyle: 'symmetric-bus',
    offsetU: 0.15,
    clearanceU: 0.1,
    fallbackRowIntervalU: 1,
    preferredScope: 'all',
  },
} as const;
const CELLS = [
  { keyId: 'k0', half: 'left', row: 0, col: 0 },
  { keyId: 'k1', half: 'left', row: 0, col: 1 },
  { keyId: 'k2', half: 'left', row: 1, col: 0 },
  { keyId: 'k3', half: 'left', row: 1, col: 1 },
] as const;

it.each([
  {
    name: 'stagger',
    keys: [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 1, yU: 0 },
      { id: 'k2', xU: 0.25, yU: 1 },
      { id: 'k3', xU: 1.4, yU: 1 },
    ],
  },
  {
    name: 'rotated keys',
    keys: [
      { id: 'k0', xU: 0, yU: 0, rotationDeg: 30 },
      { id: 'k1', xU: 1, yU: 0, rotationDeg: 90 },
      { id: 'k2', xU: 0, yU: 1 },
      { id: 'k3', xU: 1, yU: 1 },
    ],
  },
  {
    name: 'thumb cluster',
    keys: [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 1, yU: 0 },
      { id: 'k2', xU: 0, yU: 1 },
      { id: 'k3', xU: 2, yU: 2, widthU: 1.5, heightU: 1.5 },
    ],
  },
])('routes $name using explicit logical cells without changing key geometry', ({ keys }) => {
  const source = buildProject({ keys });
  const result = getResultValue(regenerateWiring(source, { ...INPUT, cells: CELLS }));
  expect(getWiringCells(result.project).map(({ row, col }) => [row, col])).toEqual([
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ]);
  expect(result.project.keys.map(withoutDiode)).toEqual(keys);
  expect(source.wires).toEqual([]);
});

it('preserves every opposite-half conductor and lock while rebuilding the selected half', () => {
  const source = lockedRight(
    getResultValue(
      regenerateWiring(
        buildProject({
          keys: [
            { id: 'k0', xU: 0, yU: 0, half: 'left' },
            { id: 'k1', xU: 6, yU: 0, half: 'right' },
          ],
        }),
        INPUT,
      ),
    ).project,
  );
  const candidate = getResultValue(
    regenerateWiring(source, { ...INPUT, scope: { kind: 'half', half: 'left' } }),
  ).project;
  expect(candidate.wires.filter(isRight)).toEqual(source.wires.filter(isRight));
  expect(candidate.keys[1]).toEqual(source.keys[1]);
  expect(validateWireProtection(source, candidate)).toEqual([]);
});

function withoutDiode(key: Key): Key {
  const { diode: _diode, ...geometry } = key;
  return geometry;
}
function isRight(wire: Wire): boolean {
  return wire.half === 'right';
}
function lockedRight(project: Project): Project {
  return { ...project, wires: project.wires.map(lockRight) };
}
function lockRight(wire: Wire): Wire {
  return isRight(wire) ? { ...wire, locked: true } : wire;
}
