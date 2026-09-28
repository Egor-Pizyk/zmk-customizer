import { describe, expect, it } from 'vitest';
import { getNets } from './get-nets';
import { buildProject, freeEnd, keyPin } from '../../tests/helpers/build-project';
import type { Project, Wire } from './types';

const KEYS = [
  { id: 'k1', xU: 0, yU: 0 },
  { id: 'k2', xU: 2, yU: 0 },
];

function netOf(project: Project, keyId: string, pin: 1 | 2) {
  return getNets(project).find((net) =>
    net.pins.some((entry) => entry.keyId === keyId && entry.pin === pin),
  );
}

describe('getNets', () => {
  it('joins the key pins a wire connects', () => {
    const wire = { id: 'w1', start: keyPin('k1', 1), end: keyPin('k2', 1), bends: [] };
    const net = netOf(buildProject({ keys: KEYS, wires: [wire] }), 'k1', 1);
    expect(net?.pins).toEqual([
      { keyId: 'k1', pin: 1 },
      { keyId: 'k2', pin: 1 },
    ]);
    expect(net?.wireIds).toEqual(['w1']);
  });

  it('lists every pin, connected or not, in key order', () => {
    const nets = getNets(buildProject({ keys: KEYS }));
    expect(nets.map((net) => net.pins)).toEqual([
      [{ keyId: 'k1', pin: 1 }],
      [{ keyId: 'k1', pin: 2 }],
      [{ keyId: 'k2', pin: 1 }],
      [{ keyId: 'k2', pin: 2 }],
    ]);
  });

  it('joins wires through a junction and through a collinear overlap', () => {
    const trunk = { id: 'w1', start: keyPin('k1', 1), end: freeEnd(0.3, 3), bends: [] };
    const branch: Wire = {
      id: 'w2',
      start: keyPin('k2', 1),
      end: { kind: 'junction', wireId: 'w1', at: { xU: 0.3, yU: 2 } },
      bends: [],
    };
    const overlap = {
      id: 'w3',
      start: keyPin('k2', 2),
      end: freeEnd(0.3, 2.5),
      bends: [{ xU: 0.3, yU: 0.2333 }],
    };
    const net = netOf(buildProject({ keys: KEYS, wires: [trunk, branch, overlap] }), 'k1', 1);
    expect(net?.wireIds).toEqual(['w1', 'w2', 'w3']);
  });

  it('joins through a connected crossing but not an insulated one', () => {
    const row = { id: 'w1', start: keyPin('k1', 1), end: freeEnd(5, 0.3667), bends: [] };
    const column = { id: 'w2', start: keyPin('k2', 2), end: freeEnd(2.6333, 3), bends: [] };
    const connected = buildProject({ keys: KEYS, wires: [row, column] });
    expect(netOf(connected, 'k1', 1)?.wireIds).toEqual(['w1', 'w2']);
    const insulated = buildProject({
      keys: KEYS,
      wires: [row, column],
      insulatedCrossings: [{ wireIds: ['w1', 'w2'], ordinal: 0 }],
    });
    expect(netOf(insulated, 'k1', 1)?.wireIds).toEqual(['w1']);
  });

  it('joins a pin that a wire passes over', () => {
    const passing = { id: 'w1', start: keyPin('k2', 1), end: freeEnd(-1, 0.3667), bends: [] };
    const project = buildProject({ keys: KEYS, wires: [passing] });
    expect(netOf(project, 'k1', 1)?.wireIds).toEqual(['w1']);
  });

  it('collects the board pins of free ends', () => {
    const wire = { id: 'w1', start: keyPin('k1', 1), end: freeEnd(0.3, 3, 4), bends: [] };
    expect(netOf(buildProject({ keys: KEYS, wires: [wire] }), 'k1', 1)?.boardPins).toEqual([
      { wireId: 'w1', side: 'end', boardPin: 4 },
    ]);
  });
});
