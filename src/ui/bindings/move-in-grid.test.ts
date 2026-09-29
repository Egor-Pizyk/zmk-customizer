import { expect, it } from 'vitest';
import { moveInGrid } from './move-in-grid';

const ROW_LENGTHS = [3, 5, 1];

it.each([
  ['ArrowRight', { row: 0, index: 1 }, { row: 0, index: 2 }],
  ['ArrowRight', { row: 0, index: 2 }, { row: 0, index: 2 }],
  ['ArrowLeft', { row: 1, index: 0 }, { row: 1, index: 0 }],
  ['ArrowDown', { row: 0, index: 2 }, { row: 1, index: 2 }],
  ['ArrowDown', { row: 1, index: 4 }, { row: 2, index: 0 }],
  ['ArrowUp', { row: 1, index: 4 }, { row: 0, index: 2 }],
  ['ArrowUp', { row: 0, index: 1 }, { row: 0, index: 1 }],
  ['Home', { row: 1, index: 3 }, { row: 1, index: 0 }],
  ['End', { row: 1, index: 0 }, { row: 1, index: 4 }],
])('%s from %j goes to %j', (key, from, to) => {
  expect(moveInGrid({ key, rowLengths: ROW_LENGTHS, from })).toEqual(to);
});

it('ignores other keys', () => {
  expect(
    moveInGrid({ key: 'a', rowLengths: ROW_LENGTHS, from: { row: 0, index: 0 } }),
  ).toBeUndefined();
});
