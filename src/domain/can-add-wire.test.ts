import { expect, it } from 'vitest';
import { buildProject, freeEnd, keyPin } from '../../tests/helpers/build-project';
import { canAddWire } from './can-add-wire';

const PROJECT = buildProject({
  keys: [
    { id: 'k1', xU: 0, yU: 0 },
    { id: 'k2', xU: 2, yU: 0 },
  ],
  wires: [{ id: 'w1', start: keyPin('k1', 1), end: freeEnd(0, 3), bends: [] }],
});

it('needs a key pin at one end or both', () => {
  expect(canAddWire(PROJECT, { start: freeEnd(0, 0), end: freeEnd(1, 0) })).toBe('no-key-pin');
  expect(canAddWire(PROJECT, { start: freeEnd(0, 0), end: keyPin('k1', 1) })).toBe('ok');
  expect(canAddWire(PROJECT, { start: keyPin('k1', 1), end: keyPin('k2', 1) })).toBe('ok');
});

it('refuses a wire from a pin to the same pin', () => {
  expect(canAddWire(PROJECT, { start: keyPin('k1', 1), end: keyPin('k1', 1) })).toBe('same-pin');
  expect(canAddWire(PROJECT, { start: keyPin('k1', 1), end: keyPin('k1', 2) })).toBe('ok');
});

it('refuses ends that reference a missing key or wire', () => {
  expect(canAddWire(PROJECT, { start: keyPin('k9', 1), end: freeEnd(0, 0) })).toBe(
    'missing-reference',
  );
  const junction = { kind: 'junction', wireId: 'w9', at: { xU: 0, yU: 0 } } as const;
  expect(canAddWire(PROJECT, { start: keyPin('k1', 2), end: junction })).toBe('missing-reference');
});
