import { expect, it } from 'vitest';
import { BOARD_PIN_COUNT, formatBoardPin } from './board-pin';

it('has 32 generic pins and no GND', () => {
  expect(BOARD_PIN_COUNT).toBe(32);
});

it('labels a pin P<n>', () => {
  expect(formatBoardPin(0)).toBe('P0');
  expect(formatBoardPin(31)).toBe('P31');
});
