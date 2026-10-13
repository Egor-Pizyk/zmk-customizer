import { expect, it } from 'vitest';
import { buildProject } from '../../../helpers/build-project';
import { removeKeys } from '@domain';

it('removes all selected key identities and their bindings while keeping unrelated data', () => {
  const project = buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 2, yU: 0 },
      { id: 'k2', xU: 4, yU: 0 },
    ],
    bindings: { k0: { kind: 'trans' }, k1: { kind: 'none' }, k2: { kind: 'trans' } },
  });
  const next = removeKeys(project, { keyIds: ['k0', 'k2'] });
  expect(next.keys.map((key) => key.id)).toEqual(['k1']);
  expect(next.layers[0]?.bindings).toEqual({ k1: { kind: 'none' } });
  expect(removeKeys(project, { keyIds: ['missing'] })).toBe(project);
});
