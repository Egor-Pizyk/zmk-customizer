const DECIMALS = 4;

// Geometry in key units is compared for equality (pins, corners, crossings), so derived values are
// rounded to 4 decimals like the UI grid snap to drop float noise (e.g. 3.81 / 19.05).
export function roundU(valueU: number): number {
  const rounded = Number(valueU.toFixed(DECIMALS));
  return rounded === 0 ? 0 : rounded;
}
