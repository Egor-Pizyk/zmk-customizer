import { buildConnectedMatrix } from '../../../helpers/connected-matrix';
import { expect, it } from 'vitest';
import { moveKeys } from '@domain/keys';
import { editWiring } from '@domain/wiring/editing';
import { getNets } from '@domain/wires/nets';
import { buildProject } from '../../../helpers/build-project';
import { getControllerFixtures } from '../../../helpers/controller-fixtures';
import { getDefinedValue } from '../../../helpers/defined-value';
import { getResultValue } from '../../../helpers/result';

it.each([
  { xU: 8, yU: 5 },
  { xU: 6, yU: 5 },
  { xU: 7, yU: 6 },
])('moves the wired upper-right key to %s', (position) => {
  const board = getDefinedValue(getControllerFixtures().boards[0]);
  const project = getResultValue(
    editWiring(
      buildProject({
        keys: [
          { id: 'k0', xU: 5, yU: 5 },
          { id: 'k1', xU: 7, yU: 5 },
          { id: 'k2', xU: 5, yU: 7 },
          { id: 'k3', xU: 7, yU: 7 },
        ],
      }),
      { kind: 'auto', gridStepU: 1, board },
    ),
  );

  const moved = moveKeys(project, { moves: [{ keyId: 'k1', position }] });
  expect(moved.keys[1]).toMatchObject(position);
  expect(getNets(moved).map((net) => net.pins)).toEqual(getNets(project).map((net) => net.pins));
});

it.each([
  { xU: 8, yU: 5 },
  { xU: 6, yU: 5 },
  { xU: 7, yU: 6 },
])('preserves hand-drawn matrix connections at %s', (position) => {
  const project = buildConnectedMatrix();
  const original = structuredClone(project);
  const moved = moveKeys(project, { moves: [{ keyId: 'k1', position }] });
  expect(moved.keys[1]).toMatchObject(position);
  expect(getNets(moved).map((net) => net.pins)).toEqual([
    [
      { keyId: 'k0', pin: 1 },
      { keyId: 'k1', pin: 1 },
    ],
    [
      { keyId: 'k0', pin: 2 },
      { keyId: 'k2', pin: 2 },
    ],
    [
      { keyId: 'k1', pin: 2 },
      { keyId: 'k3', pin: 2 },
    ],
    [
      { keyId: 'k2', pin: 1 },
      { keyId: 'k3', pin: 1 },
    ],
  ]);
  expect(moved.wires).toEqual(project.wires);
  expect(project).toEqual(original);
});

it('keeps a displaced insulated crossing insulated', () => {
  const base = buildConnectedMatrix();
  const project = { ...base, insulatedCrossings: [{ wireIds: ['w1', 'w2'] as const, ordinal: 0 }] };
  const moved = moveKeys(project, { moves: [{ keyId: 'k1', position: { xU: 8, yU: 5 } }] });
  expect(moved.keys[1]?.xU).toBe(8);
  expect(moved.insulatedCrossings).toEqual([
    ...project.insulatedCrossings,
    { wireIds: ['w2', 'w5'], ordinal: 0 },
  ]);
  expect(getNets(moved).map((net) => net.pins)).toEqual(getNets(project).map((net) => net.pins));
});
it('retains the resource refusal for an oversized project', () => {
  const base = buildConnectedMatrix();
  const project = {
    ...base,
    wires: Array.from({ length: 601 }, (_, index) => ({
      ...getDefinedValue(base.wires[0]),
      id: `w${index}`,
    })),
  };
  expect(moveKeys(project, { moves: [{ keyId: 'k1', position: { xU: 8, yU: 5 } }] })).toBe(project);
});
