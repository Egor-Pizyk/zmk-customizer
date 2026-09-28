import { expect, it } from 'vitest';
import { setWireEndBoardPin } from './set-wire-end-board-pin';
import { buildProject, freeEnd, keyPin } from '../../tests/helpers/build-project';

const PROJECT = buildProject({
  keys: [{ id: 'k1', xU: 0, yU: 0 }],
  wires: [{ id: 'w1', start: keyPin('k1', 1), end: freeEnd(3, 3), bends: [] }],
});

it('sets and removes the board pin of a free end', () => {
  const assigned = setWireEndBoardPin(PROJECT, { wireId: 'w1', side: 'end', boardPin: 3 });
  expect(assigned.wires[0]?.end).toEqual(freeEnd(3, 3, 3));
  const cleared = setWireEndBoardPin(assigned, { wireId: 'w1', side: 'end', boardPin: undefined });
  expect(cleared.wires[0]?.end).toEqual(freeEnd(3, 3));
  expect(cleared.wires[0]?.end).not.toHaveProperty('boardPin');
});

it('leaves an end that is not free unchanged', () => {
  const project = setWireEndBoardPin(PROJECT, { wireId: 'w1', side: 'start', boardPin: 3 });
  expect(project.wires[0]?.start).toEqual(keyPin('k1', 1));
});
