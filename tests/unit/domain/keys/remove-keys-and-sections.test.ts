import { getResultValue } from '../../../helpers/result';
import { getProjectResourceError } from '@domain/project';
import { expect, it } from 'vitest';
import { removeKeysAndSections, removeKey } from '@domain/keys';
import { buildProject, freeEnd } from '../../../helpers/build-project';

function circuit() {
  return buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 4, yU: 0 },
    ],
    wires: [
      { id: 'w1', start: freeEnd(0, 3), end: freeEnd(4, 3), bends: [] },
      { id: 'w2', start: freeEnd(2, 2), end: freeEnd(2, 4), bends: [] },
      { id: 'w3', start: freeEnd(6, 3, 4), end: freeEnd(8, 3), bends: [] },
    ],
    bindings: { k0: { kind: 'trans' }, k1: { kind: 'none' } },
  });
}
it('keeps unrelated free conductors when deleting an ordinary key', () => {
  const project = circuit();
  expect(removeKey(project, { keyId: 'k0' }).wires).toEqual(project.wires);
});
it('cuts the selected section then deletes keys atomically without losing independent branches', () => {
  const project = circuit();
  const original = structuredClone(project);
  const result = removeKeysAndSections(project, {
    base: project,
    keyIds: ['k0'],
    sectionIds: ['w1:0:0'],
  });
  expect(result.ok).toBe(true);

  expect(getResultValue(result).keys).toEqual([{ id: 'k1', xU: 4, yU: 0 }]);
  expect(getResultValue(result).wires).toHaveLength(3);
  expect(getResultValue(result).wires[0]).toMatchObject({
    start: freeEnd(2, 3),
    end: freeEnd(4, 3),
  });
  expect(getResultValue(result).wires.slice(1)).toEqual(project.wires.slice(1));
  expect(getResultValue(result).layers[0]?.bindings).toEqual({ k1: { kind: 'none' } });
  expect(project).toEqual(original);
});
it('refuses stale or unknown sections without deleting any key', () => {
  const project = circuit();
  expect(
    removeKeysAndSections(project, { base: { ...project }, keyIds: ['k0'], sectionIds: ['w1:0:0'] })
      .ok,
  ).toBe(false);
  expect(
    removeKeysAndSections(project, { base: project, keyIds: ['k0'], sectionIds: ['missing'] }).ok,
  ).toBe(false);
  expect(project.keys).toHaveLength(2);
});
it('refuses fragment resource overflow without deleting keys', () => {
  const base = circuit();
  const project = {
    ...base,
    wires: [
      { id: 'w1', start: freeEnd(0, 3), end: freeEnd(6, 3), bends: [] },
      { id: 'w2', start: freeEnd(2, 2), end: freeEnd(2, 4), bends: [] },
      { id: 'w3', start: freeEnd(4, 2), end: freeEnd(4, 4), bends: [] },
      ...Array.from({ length: 597 }, (_, index) => ({
        id: `w${index + 4}`,
        start: freeEnd(20 + index, 20),
        end: freeEnd(20 + index, 21),
        bends: [],
      })),
    ],
  };
  expect(getProjectResourceError(project)).toBeUndefined();
  expect(
    removeKeysAndSections(project, { base: project, keyIds: ['k0'], sectionIds: ['w1:0:1'] }).ok,
  ).toBe(false);
  expect(project.keys).toHaveLength(2);
});
