import { expect, it } from 'vitest';
import { parseProjectFile } from '@storage/project';
import { buildProject, keyPin, freeEnd } from '../../../helpers/build-project';
import { getResultError } from '../../../helpers/result';

const base = {
  ...buildProject({
    keys: [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 1, yU: 0 },
    ],
  }),
  schemaVersion: 11,
};
const wire = { id: 'w1', start: keyPin('k1', 1), end: keyPin('k2', 1), bends: [] };

it.each([
  ['dangling key', { wires: [{ ...wire, end: keyPin('k9', 1) }] }, 'wires.0.end.keyId'],
  [
    'dangling junction',
    { wires: [{ ...wire, end: { kind: 'junction', wireId: 'w9', at: { xU: 0, yU: 0 } } }] },
    'wires.0.end.wireId',
  ],
  ['same pin', { wires: [{ ...wire, end: wire.start }] }, 'wires.0.end'],
  [
    'no endpoint pin',
    { wires: [{ ...wire, start: freeEnd(0, 0), end: freeEnd(2, 0) }] },
    'wires.0',
  ],
  ['duplicate ids', { wires: [wire, wire] }, 'wires.1.id'],
  [
    'dangling binding',
    { layers: [{ id: 'l0', name: 'Base', bindings: { k9: { kind: 'none' } } }] },
    'layers.0.bindings.k9',
  ],
  [
    'dangling encoder binding',
    {
      layers: [
        {
          id: 'l0',
          name: 'Base',
          bindings: {},
          encoderBindings: {
            e9: { clockwise: { kind: 'none' }, counterclockwise: { kind: 'none' } },
          },
        },
      ],
    },
    'layers.0.encoderBindings.e9',
  ],
  [
    'dangling crossing',
    { wires: [wire], insulatedCrossings: [{ wireIds: ['w1', 'w9'], ordinal: 0 }] },
    'insulatedCrossings.0.wireIds',
  ],
])('rejects legacy %s before migration geometry', (_label, change, path) => {
  expect(
    JSON.stringify(getResultError(parseProjectFile(JSON.stringify({ ...base, ...change })))),
  ).toContain(path);
});

it('preserves the legacy segment processing limit', () => {
  const wires = Array.from({ length: 24 }, (_, index) => ({
    ...wire,
    id: `w${index}`,
    bends: Array.from({ length: 64 }, (_point, position) => ({ xU: position, yU: index })),
  }));
  expect(
    JSON.stringify(getResultError(parseProjectFile(JSON.stringify({ ...base, wires })))),
  ).toContain('processing budget');
});

it('accepts retained v11 encoder bindings before migrating the schematic', () => {
  const encoders = [{ id: 'e1', xU: 0, yU: 0, half: 'left', steps: 80, triggersPerRotation: 20 }];
  const layers = [
    {
      id: 'l0',
      name: 'Base',
      bindings: {},
      encoderBindings: { e1: { clockwise: { kind: 'none' }, counterclockwise: { kind: 'none' } } },
    },
  ];
  expect(parseProjectFile(JSON.stringify({ ...base, encoders, layers })).ok).toBe(true);
});
