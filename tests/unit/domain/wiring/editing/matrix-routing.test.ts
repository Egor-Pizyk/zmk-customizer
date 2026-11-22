import { expect, it } from 'vitest';
import type { Project } from '@domain';
import { editWiring } from '@domain/wiring/editing';
import { getNets } from '@domain/wires/nets';
import { getWirePath } from '@domain/wires/geometry';
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
  expect(result.ok).toBe(false);
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
