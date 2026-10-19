/** Product resource limits measured in specs/024-codebase-health-audit/research.md. */
export const PROJECT_BUDGET = {
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
