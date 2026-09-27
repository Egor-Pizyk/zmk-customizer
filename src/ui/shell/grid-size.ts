export const GRID_SIZE_MIN_U = 0.05;
export const GRID_SIZE_MAX_U = 2;
export const GRID_PRESETS_U: readonly number[] = [1, 0.5, 0.25, 0.125];

export type GridSizeParseResult =
  | { readonly isValid: true; readonly value: number }
  | { readonly isValid: false; readonly message: string };

const RANGE_MESSAGE = `Enter a grid size from ${GRID_SIZE_MIN_U}u to ${GRID_SIZE_MAX_U}u, up to 3 decimals`;
const DECIMAL_PATTERN = /^\d+(?:\.\d{1,3})?$/u;

// Accepts a comma decimal ("0,25"): the field is type="text" inputMode="decimal" (spec 001 T038).
// At most 3 decimals, so snapped values stay exact in the 3-decimal readout (SC-006).
export function parseGridSizeInput(text: string): GridSizeParseResult {
  const trimmed = text.trim().replace(',', '.');
  const value = DECIMAL_PATTERN.test(trimmed) ? Number(trimmed) : Number.NaN;
  if (!Number.isFinite(value) || value < GRID_SIZE_MIN_U || value > GRID_SIZE_MAX_U) {
    return { isValid: false, message: RANGE_MESSAGE };
  }
  return { isValid: true, value };
}
