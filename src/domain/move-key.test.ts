import { expect, it } from 'vitest';
import { moveKey } from './move-key';
import { buildProject } from '../../tests/helpers/build-project';

it('moves only the given key', () => {
  const before = buildProject({
    keys: [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 1, yU: 0 },
    ],
  });
  const after = moveKey(before, { keyId: 'k2', position: { xU: 3, yU: 2 } });
  expect(after.keys).toEqual([
    { id: 'k1', xU: 0, yU: 0 },
    { id: 'k2', xU: 3, yU: 2 },
  ]);
  expect(before.keys[1]).toEqual({ id: 'k2', xU: 1, yU: 0 });
});

it('preserves identity when the key is unknown or already at the requested position', () => {
  const project = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
  expect(moveKey(project, { keyId: 'missing', position: { xU: 2, yU: 3 } })).toBe(project);
  expect(moveKey(project, { keyId: 'k1', position: { xU: 0, yU: 0 } })).toBe(project);
});
