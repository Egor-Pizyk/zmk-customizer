import { describe, expect, it } from 'vitest';
import { buildProject, freeEnd, keyPin } from '../../../helpers/build-project';
import { findWireContacts } from '@domain';

describe('findWireContacts', () => {
  it('does not treat a wire end resting on another wire as a crossing (T-touch)', () => {
    const keys = [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 2, yU: 0 },
      { id: 'k3', xU: 4, yU: 0 },
    ];
    const row = { id: 'w1', start: keyPin('k1', 1), end: keyPin('k3', 1), bends: [] };
    const branch = { id: 'w2', start: keyPin('k2', 1), end: freeEnd(2.3, 3), bends: [] };
    expect(findWireContacts(buildProject({ keys, wires: [row, branch] }))).toEqual({
      crossings: [],
      overlaps: [],
    });
  });

  it('reports a collinear overlap as a join, not a crossing', () => {
    const one = { id: 'w1', start: freeEnd(0, 1), end: freeEnd(4, 1), bends: [] };
    const two = { id: 'w2', start: freeEnd(2, 1), end: freeEnd(6, 1), bends: [] };
    expect(findWireContacts(buildProject({ wires: [one, two] }))).toEqual({
      crossings: [],
      overlaps: [['w1', 'w2']],
    });
  });
});
