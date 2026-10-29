import { expect, it } from 'vitest';
import { getControllerBoard } from '@catalog/controllers';
import { ZMK_LIMITS } from '@catalog/firmware';
import { createWiringProposal } from '@domain/wiring/editing';
import { getRoutingSettings } from '@domain/wiring';
import { findWireContacts } from '@domain/wires/contacts';
import { getNets } from '@domain/wires/nets';
import { getWireConductors } from '@domain/wires/geometry';
import type { Key, Project, WirePoint } from '@domain';
import { buildProject } from '../../../../helpers/build-project';

it('separates every Direct route including ground, with one GPIO per key', () => {
  const source = buildProject({
    keys: Array.from({ length: 9 }, (_, i) => ({
      id: `k${i}`,
      xU: i % 3,
      yU: Math.floor(i / 3),
    })),
  });
  const candidate = generate(source);
  expect(candidate.wires).toHaveLength(18);
  expect(findWireContacts(candidate).overlaps).toEqual([]);
  expect(minimumParallelGap(candidate)).toBeGreaterThanOrEqual(0.09999);
  expect(minimumOutputGap(candidate)).toBeGreaterThanOrEqual(0.29999);
  expect(new Set(candidate.wires.map((wire) => JSON.stringify(wire.end))).size).toBe(18);
  expect(candidate.wiring?.terminals.filter((terminal) => terminal.kind === 'input')).toHaveLength(
    9,
  );
  expect(candidate.wiring?.terminals.filter((terminal) => terminal.kind === 'ground')).toHaveLength(
    1,
  );
  expect(
    getNets(candidate)
      .map((net) => net.pins.length)
      .toSorted((first, second) => first - second),
  ).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 9]);
  expect(generate(source)).toEqual(candidate);
  expect(source.wires).toEqual([]);
});

it.each(['stagger', 'rotated', 'split'] as const)(
  'keeps Direct routes separated for %s geometry',
  (kind) => {
    const source = geometry(kind);
    const candidate = generate(source);
    expect(candidate.wires).toHaveLength(source.keys.length * 2);
    expect(findWireContacts(candidate).overlaps).toEqual([]);
    expect(minimumParallelGap(candidate)).toBeGreaterThanOrEqual(0.09999);
    expect(minimumOutputGap(candidate)).toBeGreaterThanOrEqual(0.29999);
    expect(new Set(candidate.wires.map((wire) => JSON.stringify(wire.end))).size).toBe(
      source.keys.length * 2,
    );
  },
);
function geometry(kind: 'stagger' | 'rotated' | 'split'): Project {
  const keys = Array.from({ length: 6 }, (_, i) => ({
    id: `k${i}`,
    xU: i % 3,
    yU: Math.floor(i / 3),
  }));
  return buildProject({ keys: keys.map((key, index) => transformKey(key, { kind, index })) });
}
function transformKey(key: Key, input: { readonly kind: string; readonly index: number }): Key {
  if (input.kind === 'stagger') {
    return { ...key, yU: key.yU + (input.index % 3) * 0.2 };
  }
  if (input.kind === 'rotated') {
    return {
      ...key,
      rotationDeg: 30,
      rotationOriginXU: key.xU + 0.5,
      rotationOriginYU: key.yU + 0.5,
    };
  }
  return {
    ...key,
    xU: key.xU + (input.index < 3 ? 0 : 7),
    half: input.index < 3 ? 'left' : 'right',
  };
}

function generate(project: Project): Project {
  const board = getControllerBoard(project.controllerId);
  const proposal = createWiringProposal(project, [
    { kind: 'mode', mode: 'direct', board },
    {
      kind: 'regenerate',
      board,
      input: { settings: getRoutingSettings(project), scope: { kind: 'all' }, limits: ZMK_LIMITS },
    },
  ]);
  if (proposal.kind !== 'changed') {
    throw new Error(JSON.stringify(proposal));
  }
  return proposal.candidate;
}
type Segment = { readonly id: string; readonly from: WirePoint; readonly to: WirePoint };
function minimumParallelGap(project: Project): number {
  let gap = Infinity;
  const segments = project.wires.flatMap((wire) =>
    getWireConductors(project, wire).flatMap((points) =>
      points.slice(1).map((to, index) => ({ id: wire.id, from: points[index] ?? to, to })),
    ),
  );
  for (const first of segments) {
    for (const second of segments) {
      if (first.id !== second.id) {
        gap = Math.min(gap, parallelGap(first, second));
      }
    }
  }
  return gap;
}
function parallelGap(first: Segment, second: Segment): number {
  const horizontal = first.from.yU === first.to.yU;
  if (horizontal !== (second.from.yU === second.to.yU)) {
    return Infinity;
  }
  const axis = horizontal ? 'xU' : 'yU';
  const fixed = horizontal ? 'yU' : 'xU';
  if (
    Math.max(first.from[axis], first.to[axis]) < Math.min(second.from[axis], second.to[axis]) ||
    Math.max(second.from[axis], second.to[axis]) < Math.min(first.from[axis], first.to[axis])
  ) {
    return Infinity;
  }
  return Math.abs(first.from[fixed] - second.from[fixed]);
}

function minimumOutputGap(project: Project): number {
  const points = project.wires.flatMap((wire) => (wire.end.kind === 'free' ? [wire.end.at] : []));
  let gap = Infinity;
  for (const [index, point] of points.entries()) {
    for (const other of points.slice(index + 1)) {
      gap = Math.min(gap, Math.hypot(point.xU - other.xU, point.yU - other.yU));
    }
  }
  return gap;
}
