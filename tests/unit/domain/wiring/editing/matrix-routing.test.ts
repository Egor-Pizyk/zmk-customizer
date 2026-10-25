import { expect, it } from 'vitest';
import type { Project } from '@domain';
import { editWiring } from '@domain/wiring/editing';
import { getNets } from '@domain/wires/nets';
import { getKeyPinPosition, getWirePath } from '@domain/wires/geometry';
import { deriveWiring, getWiringCells } from '@domain/wiring/matrix';
import { getWiringConnections } from '@domain/wiring';
import { getControllerFixtures } from '../../../../helpers/controller-fixtures';
import { getResultValue } from '../../../../helpers/result';
import { getDefinedValue } from '../../../../helpers/defined-value';

const { boards, project: fixture } = getControllerFixtures();
const board = getDefinedValue(boards[0]);
function rebuild(project: Project) {
  return getResultValue(editWiring(project, { kind: 'auto', gridStepU: 1, board }));
}
function grid(size: number): Project {
  return {
    ...fixture,
    keys: Array.from({ length: size * size }, (_entry, index) => ({
      id: `k${index}`,
      xU: index % size,
      yU: Math.floor(index / size),
    })),
    wires: [],
    insulatedCrossings: [],
  };
}
function outputs(project: Project) {
  return project.wires
    .flatMap((wire) => [wire.start, wire.end])
    .flatMap((end) =>
      end.kind === 'free' && end.terminalId !== undefined
        ? [{ terminalId: end.terminalId, at: end.at }]
        : [],
    );
}

function expectCircuit(project: Project) {
  const wiring = getDefinedValue(project.wiring);
  const nets = getNets(project);
  for (const terminal of wiring.terminals) {
    const expected = getWiringConnections(wiring, getWiringCells(project))
      .filter((connection) => connection.terminalId === terminal.id)
      .map(({ keyId, pin }) => `${keyId}:${pin}`)
      .toSorted();
    const net = getDefinedValue(nets.find((entry) => entry.terminalIds.includes(terminal.id)));
    expect(net.terminalIds).toEqual([terminal.id]);
    expect(net.pins.map(({ keyId, pin }) => `${keyId}:${pin}`).toSorted()).toEqual(expected);
    expect(outputs(project).filter((end) => end.terminalId === terminal.id)).toHaveLength(1);
  }
  expect(deriveWiring(project, board).ok).toBe(true);
}
for (const size of [3, 6]) {
  it(`connects ${size}x${size} with shorter local trees and two aligned output blocks`, () => {
    const original = grid(size);
    const before = structuredClone(original);
    const project = rebuild(original);
    expectCircuit(project);
    expect(rebuild(original)).toEqual(project);
    expect(original).toEqual(before);
    let starLength = 0;
    for (const connection of getWiringConnections(
      getDefinedValue(project.wiring),
      getWiringCells(project),
    )) {
      const key = getDefinedValue(project.keys.find((entry) => entry.id === connection.keyId));
      const start = getKeyPinPosition(key, connection.pin);
      const end = getDefinedValue(
        outputs(project).find((entry) => entry.terminalId === connection.terminalId),
      );
      starLength += Math.abs(start.xU - end.at.xU) + Math.abs(start.yU - end.at.yU);
    }
    const length = project.wires.reduce(
      (total, wire) => total + pathLength(getWirePath(project, wire)),
      0,
    );
    expect(length).toBeLessThan(starLength * 0.8);
    for (const kind of ['row', 'col']) {
      const ids = new Set(
        project.wiring?.terminals
          .filter((terminal) => terminal.kind === kind)
          .map((terminal) => terminal.id),
      );
      const points = outputs(project)
        .filter((end) => ids.has(end.terminalId))
        .map((end) => end.at);
      expect(new Set(points.map((point) => point.xU)).size).toBe(1);
      expect(points.map((point) => point.yU)).toEqual(
        Array.from({ length: size }, (_entry, index) => index),
      );
    }
  });
}
function pathLength(points: readonly { readonly xU: number; readonly yU: number }[]) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = getDefinedValue(points[index - 1]);
    const point = getDefinedValue(points[index]);
    expect(point.xU === previous.xU || point.yU === previous.yU).toBe(true);
    total += Math.abs(point.xU - previous.xU) + Math.abs(point.yU - previous.yU);
  }
  return total;
}
it('routes irregular rotated contacts and refuses coincident unrelated pins atomically', () => {
  const base = grid(3);
  const project = {
    ...base,
    keys: base.keys.slice(0, 4).map((key, index) => ({
      id: key.id,
      xU: index * 2,
      yU: index * 0.4,
      rotationDeg: index * 23,
    })),
  };
  expectCircuit(rebuild(project));
  const coincident = {
    ...base,
    keys: base.keys.slice(0, 2).map((key) => ({ id: key.id, xU: 0, yU: 0 })),
  };
  const before = structuredClone(coincident);
  expect(editWiring(coincident, { kind: 'auto', gridStepU: 1, board }).ok).toBe(false);
  expect(coincident).toEqual(before);
});

it('refuses retained-wire budget overflow without changing the source', () => {
  const original = grid(1);
  const project: Project = {
    ...original,
    wires: Array.from({ length: 600 }, (_entry, index) => ({
      id: `manual${index}`,
      start: { kind: 'free', at: { xU: 100, yU: 100 } },
      end: { kind: 'free', at: { xU: 101, yU: 100 } },
      bends: [],
    })),
  };
  const before = structuredClone(project);
  const result = editWiring(project, { kind: 'auto', gridStepU: 1, board });
  expect(result).toEqual({
    ok: false,
    error: 'Routing exceeds 600 wires. Simplify retained wiring before rebuilding.',
  });
  expect(project).toEqual(before);
});

it('uses the same matrix router after an applied split topology round trip', () => {
  const original = rebuild(grid(3));
  const split = getResultValue(
    editWiring(original, { kind: 'topology', topology: 'split', board }),
  );
  const unified = getResultValue(
    editWiring(split, { kind: 'topology', topology: 'unibody', board }),
  );
  expect(unified.wires.map((wire) => getWirePath(unified, wire))).toEqual(
    original.wires.map((wire) => getWirePath(original, wire)),
  );
  expect(getNets(unified).map((net) => net.terminalIds.length)).toEqual(
    Array.from({ length: 6 }, () => 1),
  );
  expect(unified.keys).toEqual(original.keys);
});
