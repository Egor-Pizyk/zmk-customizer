import { describe, expect, it } from 'vitest';
import { GRID_PRESETS_U, parseGridSizeInput } from './grid-size';

const RANGE_MESSAGE = 'Enter a grid size from 0.05u to 2u, up to 3 decimals';

describe('parseGridSizeInput', () => {
  it.each([
    ['0.1', 0.1],
    ['0.05', 0.05],
    ['2', 2],
    ['0,25', 0.25],
    [' 0.5 ', 0.5],
    ['0.125', 0.125],
  ])('accepts %s', (text, value) => {
    expect(parseGridSizeInput(text)).toEqual({ isValid: true, value });
  });

  // More than 3 decimals would break the exact snapped readout (SC-006).
  it.each(['0.04', '3', '', 'abc', '0.0625', '0.3333', '1e-1'])('rejects %s', (text) => {
    expect(parseGridSizeInput(text)).toEqual({ isValid: false, message: RANGE_MESSAGE });
  });
});

it('offers the preset grid sizes', () => {
  expect(GRID_PRESETS_U).toEqual([1, 0.5, 0.25, 0.125]);
});
