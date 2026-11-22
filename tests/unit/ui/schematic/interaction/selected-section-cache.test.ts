import { expect, it, vi } from 'vitest';
import * as wireQueries from '@domain/wires';
import { getSelectedSectionIds } from '@ui/schematic/interaction';
import { buildProject, freeEnd } from '../../../../helpers/build-project';

it('shares one electrical section calculation across Parts rows without reusing a changed project', () => {
  const source = buildProject({
    wires: [
      { id: 'w1', start: freeEnd(0, 1), end: freeEnd(4, 1), bends: [] },
      { id: 'w2', start: freeEnd(2, 0), end: freeEnd(2, 2), bends: [] },
    ],
  });
  const query = vi.spyOn(wireQueries, 'getWireSections');
  for (let row = 0; row < 100; row += 1) {
    expect(getSelectedSectionIds(source, { kind: 'wire', wireId: 'w1' })).toEqual([
      'w1:0:0',
      'w1:0:1',
    ]);
  }
  expect(query).toHaveBeenCalledTimes(1);
  expect(getSelectedSectionIds({ ...source, wires: [] }, { kind: 'wire', wireId: 'w1' })).toEqual(
    [],
  );
  expect(query).toHaveBeenCalledTimes(2);
  expect(getSelectedSectionIds(source, { kind: 'wire', wireId: 'w1' })).toEqual([
    'w1:0:0',
    'w1:0:1',
  ]);
  expect(query).toHaveBeenCalledTimes(2);
});
