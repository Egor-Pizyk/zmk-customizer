import { describe, expect, it } from 'vitest';
import { findCrossings } from './find-crossings';
import { buildProject, freeEnd } from '../../tests/helpers/build-project';
import type { Wire } from './types';

function line(id: string, from: [number, number], to: [number, number]): Wire {
  return { id, start: freeEnd(from[0], from[1]), end: freeEnd(to[0], to[1]), bends: [] };
}

const HORIZONTAL = line('w1', [0, 1], [4, 1]);

describe('findCrossings', () => {
  it('finds a plus-shaped crossing, connected by default', () => {
    const project = buildProject({ wires: [HORIZONTAL, line('w2', [2, 0], [2, 3])] });
    expect(findCrossings(project)).toEqual([
      { ref: { wireIds: ['w1', 'w2'], ordinal: 0 }, at: { xU: 2, yU: 1 }, isInsulated: false },
    ]);
  });

  it('marks stored crossings as insulated', () => {
    const project = buildProject({
      wires: [HORIZONTAL, line('w2', [2, 0], [2, 3])],
      insulatedCrossings: [{ wireIds: ['w1', 'w2'], ordinal: 0 }],
    });
    expect(findCrossings(project)[0]?.isInsulated).toBe(true);
  });

  it('ignores a junction, a collinear overlap, ends touching a wire and a wire crossing itself', () => {
    const junction: Wire = {
      id: 'w2',
      start: freeEnd(2, 3),
      end: { kind: 'junction', wireId: 'w1', at: { xU: 2, yU: 1 } },
      bends: [],
    };
    const overlap = line('w3', [3, 1], [6, 1]);
    const sharedEnd = line('w4', [4, 1], [4, 5]);
    const loop: Wire = {
      id: 'w5',
      start: freeEnd(10, 0),
      end: freeEnd(9, 1),
      bends: [
        { xU: 10, yU: 2 },
        { xU: 11, yU: 2 },
        { xU: 11, yU: 1 },
      ],
    };
    const project = buildProject({ wires: [HORIZONTAL, junction, overlap, sharedEnd, loop] });
    expect(findCrossings(project)).toEqual([]);
  });

  it('numbers several crossings of one pair along the first wire', () => {
    const zigzag: Wire = {
      id: 'w2',
      start: freeEnd(3, 0),
      end: freeEnd(1, 0),
      bends: [
        { xU: 3, yU: 2 },
        { xU: 1, yU: 2 },
      ],
    };
    const crossings = findCrossings(buildProject({ wires: [HORIZONTAL, zigzag] }));
    expect(crossings.map((crossing) => [crossing.ref.ordinal, crossing.at.xU])).toEqual([
      [0, 1],
      [1, 3],
    ]);
  });

  it('gives each non-collinear pair through one point its own crossing', () => {
    const vertical = line('w2', [2, 0], [2, 3]);
    const secondHorizontal = line('w3', [1, 1], [3, 1]);
    const pairs = findCrossings(
      buildProject({ wires: [HORIZONTAL, vertical, secondHorizontal] }),
    ).map((crossing) => crossing.ref.wireIds.join('×'));
    expect(pairs).toEqual(['w1×w2', 'w2×w3']);
  });
});

it('handles the former 150000-bend argument-limit crash without spreading user arrays into calls', () => {
  const bends = Array.from({ length: 150_000 }, (_, index) => ({ xU: index % 2, yU: 2 }));
  const project = buildProject({ wires: [{ ...HORIZONTAL, bends }] });
  expect(findCrossings(project)).toEqual([]);
});
