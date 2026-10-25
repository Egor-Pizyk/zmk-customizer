import { buildProject, keyPin, freeEnd } from './build-project';

/** Hand-drawn 2×2: the upper row joins its right key through a connected crossing. */
export function buildConnectedMatrix() {
  return buildProject({
    keys: [
      { id: 'k0', xU: 5, yU: 5 },
      { id: 'k1', xU: 7, yU: 5 },
      { id: 'k2', xU: 5, yU: 7 },
      { id: 'k3', xU: 7, yU: 7 },
    ],
    wires: [
      { id: 'w1', start: keyPin('k0', 1), end: freeEnd(10, 4.8, 0), bends: [{ xU: 5.3, yU: 4.8 }] },
      { id: 'w2', start: freeEnd(9, 4), end: keyPin('k1', 1), bends: [] },
      { id: 'w3', start: keyPin('k2', 1), end: keyPin('k3', 1), bends: [] },
      { id: 'w4', start: keyPin('k0', 2), end: keyPin('k2', 2), bends: [] },
      { id: 'w5', start: keyPin('k1', 2), end: keyPin('k3', 2), bends: [] },
    ],
  });
}
