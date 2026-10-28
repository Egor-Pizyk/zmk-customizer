import { expect, it } from 'vitest';
import { ZMK_LIMITS } from '@catalog/firmware';
import { prettifyWiring } from '@domain/wiring/editing';
import { getElectricalRelations } from '@domain/wires/nets';
import type { Project } from '@domain';
import { buildProject, freeEnd, keyPin } from '../../../../helpers/build-project';
import { getResultValue } from '../../../../helpers/result';

const INPUT = {
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

it('shortens an existing incomplete connection without adding a matrix, diode, GPIO or missing connection', () => {
  const source = buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0 }],
    wires: [
      {
        id: 'w0',
        start: keyPin('k0', 1),
        end: freeEnd(4, 2, 2),
        bends: [
          { xU: 0.3, yU: 1 },
          { xU: 1, yU: 1 },
          { xU: 1, yU: 1.5 },
          { xU: 4, yU: 1.5 },
        ],
      },
    ],
  });
  const result = getResultValue(prettifyWiring(source, INPUT)).project;
  expect(result.wires).toEqual([{ ...source.wires[0], bends: [{ xU: 4, yU: 0.3667 }] }]);
  expect(result.keys).toEqual(source.keys);
  expect(result.wiring).toBeUndefined();
  expect(getElectricalRelations(result)).toEqual(getElectricalRelations(source));
  expect(getResultValue(prettifyWiring(result, INPUT)).project).toBe(result);
});

it('does no work on an empty schematic without saving preferences', () => {
  const source = buildProject({});
  expect(getResultValue(prettifyWiring(source, INPUT)).project).toBe(source);
});

it('removes obsolete insulation when an unnecessary crossing disappears', () => {
  const source = crossedDetour();
  const result = getResultValue(prettifyWiring(source, INPUT)).project;
  expect(result.wires[1]?.bends).toEqual([]);
  expect(result.insulatedCrossings).toEqual([]);
  expect(getElectricalRelations(result)).toEqual(getElectricalRelations(source));
  expect(getResultValue(prettifyWiring(result, INPUT)).project).toBe(result);
});

it('isolates newly introduced crossings while retaining locked geometry exactly', () => {
  const source = buildProject({
    wires: [
      {
        id: 'w0',
        start: freeEnd(0, 0),
        end: freeEnd(4, 0),
        bends: [
          { xU: 0, yU: 2 },
          { xU: 4, yU: 2 },
        ],
      },
      { id: 'w1', start: freeEnd(2, -1), end: freeEnd(2, 1), bends: [], locked: true },
    ],
  });
  const result = getResultValue(prettifyWiring(source, INPUT)).project;
  expect(result.wires[0]?.bends).toEqual([]);
  expect(result.wires[1]).toEqual(source.wires[1]);
  expect(result.insulatedCrossings).toEqual([{ wireIds: ['w0', 'w1'], ordinal: 0 }]);
  expect(getElectricalRelations(result)).toEqual(getElectricalRelations(source));
});

it('retains an intentional connected crossing while simplifying its adjacent spans', () => {
  const source = buildProject({
    wires: [
      { id: 'w0', start: freeEnd(0, 0), end: freeEnd(4, 0), bends: [] },
      {
        id: 'w1',
        start: freeEnd(2, -1),
        end: freeEnd(2, 1),
        bends: [
          { xU: 1, yU: -1 },
          { xU: 1, yU: -0.5 },
          { xU: 2, yU: -0.5 },
        ],
      },
    ],
  });
  const result = getResultValue(prettifyWiring(source, INPUT)).project;
  expect(result.insulatedCrossings).toEqual([]);
  expect(getElectricalRelations(result)).toEqual(getElectricalRelations(source));
});

it('preserves explicit contacts, fixed junction sites and independent free fragments', () => {
  const source = buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 2 },
      { id: 'k1', xU: 2, yU: 1 },
    ],
    wires: [
      {
        id: 'w0',
        start: freeEnd(0, 0),
        end: freeEnd(4, 0),
        bends: [
          { xU: 0, yU: -1 },
          { xU: 1, yU: -1 },
          { xU: 1, yU: 0 },
        ],
        contacts: [{ keyId: 'k1', pin: 1, at: { xU: 2, yU: 0 } }],
        anchors: { start: { xU: 0, yU: 0 }, end: { xU: 4, yU: 0 } },
      },
      {
        id: 'w1',
        start: keyPin('k0', 1),
        end: { kind: 'junction', wireId: 'w0', at: { xU: 3, yU: 0 } },
        bends: [{ xU: 3, yU: 2.3667 }],
      },
      { id: 'w2', start: freeEnd(5, 5), end: freeEnd(6, 5), bends: [], locked: true },
    ],
  });
  const result = getResultValue(prettifyWiring(source, INPUT)).project;
  expect(result.wires[0]?.contacts).toEqual(source.wires[0]?.contacts);
  expect(result.wires[1]?.end).toEqual(source.wires[1]?.end);
  expect(result.wires[2]).toEqual(source.wires[2]);
  expect(getElectricalRelations(result)).toEqual(getElectricalRelations(source));
});

function crossedDetour(): Project {
  return buildProject({
    wires: [
      { id: 'w0', start: freeEnd(0, 0), end: freeEnd(4, 0), bends: [] },
      {
        id: 'w1',
        start: freeEnd(5, -1),
        end: freeEnd(5, 1),
        bends: [
          { xU: 2, yU: -1 },
          { xU: 2, yU: 1 },
        ],
      },
    ],
    insulatedCrossings: [{ wireIds: ['w0', 'w1'], ordinal: 0 }],
  });
}

it('does not create a preferences-only change for already clean wires and default options', () => {
  const source = buildProject({
    wires: [{ id: 'w0', start: freeEnd(0, 0), end: freeEnd(4, 0), bends: [] }],
  });
  expect(
    getResultValue(
      prettifyWiring(source, {
        ...INPUT,
        settings: { ...INPUT.settings, matrixStyle: 'existing' },
      }),
    ).project,
  ).toBe(source);
});
