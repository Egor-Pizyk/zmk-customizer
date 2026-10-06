import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { moveKeys } from './move-keys';

it('moves a group of adjacent keys together', () => {
  const before = buildProject({
    keys: [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 1, yU: 0 },
    ],
  });
  const after = moveKeys(before, {
    moves: [
      { keyId: 'k1', position: { xU: 1, yU: 0 } },
      { keyId: 'k2', position: { xU: 2, yU: 0 } },
    ],
  });
  expect(after.keys).toEqual([
    { id: 'k1', xU: 1, yU: 0 },
    { id: 'k2', xU: 2, yU: 0 },
  ]);
  expect(before.keys[0]).toEqual({ id: 'k1', xU: 0, yU: 0 });
});

it('leaves untouched keys in place', () => {
  const before = buildProject({
    keys: [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 1, yU: 0 },
      { id: 'k3', xU: 5, yU: 5 },
    ],
  });
  const after = moveKeys(before, {
    moves: [{ keyId: 'k1', position: { xU: 0, yU: 2 } }],
  });
  expect(after.keys[2]).toEqual({ id: 'k3', xU: 5, yU: 5 });
});
