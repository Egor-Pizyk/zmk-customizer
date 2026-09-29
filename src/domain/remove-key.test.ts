import { expect, it } from 'vitest';
import { getKeyPinPosition } from './get-key-pin-position';
import { removeKey } from './remove-key';
import { buildProject, freeEnd, keyPin } from '../../tests/helpers/build-project';

const KEYS = [
  { id: 'k1', xU: 0, yU: 0 },
  { id: 'k2', xU: 2, yU: 0 },
  { id: 'k3', xU: 4, yU: 0 },
];

it('removes the key and keeps the others in order', () => {
  const project = removeKey(buildProject({ keys: KEYS }), { keyId: 'k2' });
  expect(project.keys.map((key) => key.id)).toEqual(['k1', 'k3']);
});

it('turns wire ends on its pins into free ends at the pin position', () => {
  const wire = { id: 'w1', start: keyPin('k1', 1), end: keyPin('k2', 2), bends: [] };
  const project = removeKey(buildProject({ keys: KEYS, wires: [wire] }), { keyId: 'k2' });
  const { xU, yU } = getKeyPinPosition({ id: 'k2', xU: 2, yU: 0 }, 2);
  expect(project.wires).toEqual([{ ...wire, end: freeEnd(xU, yU) }]);
});

it('removes wires left without a key pin, and junctions onto them become free ends', () => {
  const orphan = { id: 'w1', start: keyPin('k2', 1), end: freeEnd(2.3, 3), bends: [] };
  const branch = {
    id: 'w2',
    start: keyPin('k1', 1),
    end: { kind: 'junction', wireId: 'w1', at: { xU: 2.3, yU: 2 } } as const,
    bends: [],
  };
  const project = removeKey(buildProject({ keys: KEYS, wires: [orphan, branch] }), {
    keyId: 'k2',
  });
  expect(project.wires).toEqual([{ ...branch, end: freeEnd(2.3, 2) }]);
});

it('repeats until no wire is left without a key pin', () => {
  const first = { id: 'w1', start: keyPin('k2', 1), end: freeEnd(2.3, 3), bends: [] };
  const second = {
    id: 'w2',
    start: keyPin('k2', 2),
    end: { kind: 'junction', wireId: 'w1', at: { xU: 2.3, yU: 2 } } as const,
    bends: [],
  };
  const third = {
    id: 'w3',
    start: keyPin('k3', 1),
    end: { kind: 'junction', wireId: 'w2', at: { xU: 2.6333, yU: 1 } } as const,
    bends: [],
  };
  const project = removeKey(buildProject({ keys: KEYS, wires: [first, second, third] }), {
    keyId: 'k2',
  });
  expect(project.wires).toEqual([{ ...third, end: freeEnd(2.3, 1) }]);
});

it('drops insulation of crossings that disappear with the key', () => {
  const horizontal = { id: 'w1', start: keyPin('k1', 1), end: freeEnd(6, 0.3667), bends: [] };
  const vertical = { id: 'w2', start: keyPin('k2', 1), end: freeEnd(2.3, -2), bends: [] };
  const before = buildProject({
    keys: KEYS,
    wires: [horizontal, vertical],
    insulatedCrossings: [{ wireIds: ['w1', 'w2'], ordinal: 0 }],
  });
  expect(removeKey(before, { keyId: 'k2' }).insulatedCrossings).toEqual([]);
});

it('drops the removed key binding and keeps every other key binding (spec 004 FR-020)', () => {
  const space = { kind: 'kp', key: { keycode: 'SPACE', modifiers: [] } } as const;
  const bindings = { k1: space, k2: { kind: 'none' }, k3: { kind: 'trans' } } as const;
  const project = removeKey(buildProject({ keys: KEYS, bindings }), { keyId: 'k2' });
  expect(project.layers[0]?.bindings).toEqual({ k1: space, k3: { kind: 'trans' } });
});
