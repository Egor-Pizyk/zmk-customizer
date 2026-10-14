import { BOARD_PIN_COUNT, formatBoardPin } from '@domain/wires';
import { expect, it } from 'vitest';

it('has 32 generic pins and no GND', () => {
  expect(BOARD_PIN_COUNT).toBe(32);
});

it('labels a pin D<n>', () => {
  expect(formatBoardPin(0)).toBe('D0');
  expect(formatBoardPin(31)).toBe('D31');
});
