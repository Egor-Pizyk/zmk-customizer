const DECIMALS = 4;

// Rounds to the grid, then to 4 decimals to drop float noise (0.1 + 0.2), so snapped values are
// exact multiples (SC-006, research R6).
export function snapToGrid(valueU: number, gridU: number): number {
  const snapped = Number((Math.round(valueU / gridU) * gridU).toFixed(DECIMALS));
  return snapped === 0 ? 0 : snapped;
}
