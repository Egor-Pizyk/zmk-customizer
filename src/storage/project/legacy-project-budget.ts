/** Frozen input budgets for schemas v11–v13; current resource changes must not relax old formats. */
export const LEGACY_PROJECT_BUDGET = {
  firmwareOptions: 128,
  firmwareStringLength: 1024,
  bytes: 5 * 1024 * 1024,
  keys: 512,
  wires: 600,
  bendsPerWire: 64,
  segments: 3000,
  layers: 64,
  taps: 64,
  crossings: 8192,
  idLength: 128,
  stringLength: 4096,
} as const;
