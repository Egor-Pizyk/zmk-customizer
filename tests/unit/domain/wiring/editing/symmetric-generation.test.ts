import { expect, it } from 'vitest';
import { getControllerBoard } from '@catalog/controllers';
import { ZMK_LIMITS } from '@catalog/firmware';
import { regenerateWiring, editWiring } from '@domain/wiring/editing';
import { getWiringCells } from '@domain/wiring/matrix';
import { getNets } from '@domain/wires/nets';
import type { RoutingSettings, Wire, Project } from '@domain';
import { buildProject } from '../../../../helpers/build-project';
import { getResultValue } from '../../../../helpers/result';

const SETTINGS: RoutingSettings = {
  matrixStyle: 'symmetric-bus',
  offsetU: 0.15,
  clearanceU: 0.1,
  fallbackRowIntervalU: 1,
  preferredScope: 'all',
};
const BOARD = getControllerBoard('nice_nano_v2');
const INPUT = {
  board: BOARD,
  limits: ZMK_LIMITS,
  settings: SETTINGS,
  scope: { kind: 'all' as const },
};
const EMPTY = buildProject({
  keys: [
    { id: 'a', xU: 0, yU: 0 },
    { id: 'b', xU: 1, yU: 0 },
    { id: 'c', xU: 0, yU: 1 },
    { id: 'd', xU: 1, yU: 1 },
  ],
});

it('generates real shared row buses and straight columns with exact electrical assignments', () => {
  const result = getResultValue(regenerateWiring(EMPTY, INPUT));
  const candidate = result.project;
  expect(getWiringCells(candidate)).toEqual([
    { keyId: 'a', half: 'left', row: 0, col: 0, rowPin: 1 },
    { keyId: 'b', half: 'left', row: 0, col: 1, rowPin: 1 },
    { keyId: 'c', half: 'left', row: 1, col: 0, rowPin: 1 },
    { keyId: 'd', half: 'left', row: 1, col: 1, rowPin: 1 },
  ]);
  expect(candidate.wiring?.terminals.map(({ kind, boardPin }) => ({ kind, boardPin }))).toEqual([
    { kind: 'row', boardPin: 0 },
    { kind: 'row', boardPin: 1 },
    { kind: 'col', boardPin: 2 },
    { kind: 'col', boardPin: 3 },
  ]);
  expect(getNets(candidate).map((net) => net.pins)).toEqual([
    [
      { keyId: 'a', pin: 1 },
      { keyId: 'b', pin: 1 },
    ],
    [
      { keyId: 'a', pin: 2 },
      { keyId: 'c', pin: 2 },
    ],
    [
      { keyId: 'b', pin: 2 },
      { keyId: 'd', pin: 2 },
    ],
    [
      { keyId: 'c', pin: 1 },
      { keyId: 'd', pin: 1 },
    ],
  ]);
  expect(candidate.keys.map((key) => key.diode)).toEqual(
    Array.from({ length: 4 }, () => ({
      pin: 1,
      cathode: 'away-switch',
    })),
  );
  expect(
    candidate.wires.filter((wire) => wire.end.kind === 'junction').map((wire) => wire.end),
  ).toEqual([
    { kind: 'junction', wireId: 'w1', at: { xU: 0.3, yU: 0 } },
    { kind: 'junction', wireId: 'w1', at: { xU: 1.3, yU: 0 } },
    { kind: 'junction', wireId: 'w4', at: { xU: 0.3, yU: 1 } },
    { kind: 'junction', wireId: 'w4', at: { xU: 1.3, yU: 1 } },
  ]);
  expect(candidate.insulatedCrossings.length).toBeGreaterThan(0);
  expect(EMPTY.wires).toEqual([]);
  expect(getResultValue(regenerateWiring(EMPTY, INPUT))).toEqual(result);
});

it('preserves known cell assignments and GPIO when regenerating existing geometry', () => {
  const source = getResultValue(regenerateWiring(EMPTY, INPUT)).project;
  const candidate = getResultValue(regenerateWiring(source, INPUT)).project;
  expect(getWiringCells(candidate)).toEqual(getWiringCells(source));
  expect(candidate.wiring).toEqual(source.wiring);
  expect(candidate.keys).toEqual(source.keys);
});

it('keeps out-of-scope keys and conductors exact and does not complete their missing links', () => {
  const source = {
    ...EMPTY,
    keys: [
      { id: 'a', xU: 0, yU: 0, half: 'left' as const },
      { id: 'b', xU: 5, yU: 0, half: 'right' as const },
    ],
  };
  const candidate = getResultValue(
    regenerateWiring(source, {
      ...INPUT,
      scope: { kind: 'half', half: 'left' },
    }),
  ).project;
  expect(candidate.keys[1]).toEqual(source.keys[1]);
  expect(getWiringCells(candidate)[1]).toEqual({ keyId: 'b', half: 'right' });
  expect(candidate.wires.flatMap(contactsOf).map((contact) => contact.keyId)).not.toContain('b');
});

it('refuses insufficient GPIO atomically and leaves the source project untouched', () => {
  const before = JSON.stringify(EMPTY);
  expect(regenerateWiring(EMPTY, { ...INPUT, board: { ...BOARD, gpioPins: [0, 1, 2] } }).ok).toBe(
    false,
  );
  expect(JSON.stringify(EMPTY)).toBe(before);
});

function contactsOf(wire: Wire) {
  return wire.contacts ?? [];
}

it('normalizes historical matrix style requests to the only supported bus generator', () => {
  const buses = getResultValue(regenerateWiring(EMPTY, INPUT)).project;
  const existing = getResultValue(
    regenerateWiring(EMPTY, { ...INPUT, settings: { ...SETTINGS, matrixStyle: 'existing' } }),
  ).project;
  expect(getWiringCells(existing)).toEqual(getWiringCells(buses));
  expect(existing.wiring).toEqual(buses.wiring);
  expect(existing.wires).toEqual(buses.wires);
  expect(existing.routing?.matrixStyle).toBe('symmetric-bus');
});

it('uses physical pin two for new row assignments when explicitly requested', () => {
  const candidate = getResultValue(
    regenerateWiring(EMPTY, { ...INPUT, settings: { ...SETTINGS, rowPin: 2 } }),
  ).project;
  expect(getWiringCells(candidate).map((cell) => cell.rowPin)).toEqual([2, 2, 2, 2]);
  expect(candidate.keys.map((key) => key.diode)).toEqual(
    Array.from({ length: 4 }, () => ({
      pin: 2,
      cathode: 'away-switch',
    })),
  );
});

it('retains a locked branch and its junction target while regenerating free neighboring connections', () => {
  const generated = getResultValue(regenerateWiring(EMPTY, INPUT)).project;
  const source = lockWire(generated, 'w2');
  const candidate = getResultValue(regenerateWiring(source, INPUT)).project;
  expect(candidate.wires.find((wire) => wire.id === 'w2')).toEqual(
    source.wires.find((wire) => wire.id === 'w2'),
  );
  expect(candidate.wires.find((wire) => wire.id === 'w1')).toEqual(
    source.wires.find((wire) => wire.id === 'w1'),
  );
  expect(getWiringCells(candidate)).toEqual(getWiringCells(source));
});

it('returns the protecting wire ID when requested diode changes conflict with a locked connection', () => {
  const source = lockWire(getResultValue(regenerateWiring(EMPTY, INPUT)).project, 'w2');
  const before = JSON.stringify(source);
  const result = regenerateWiring(source, {
    ...INPUT,
    settings: { ...SETTINGS, diodeSide: 'col' },
  });
  expect(result).toMatchObject({ ok: false, error: { code: 'locked', wireIds: ['w2'] } });
  expect(JSON.stringify(source)).toBe(before);
});

function lockWire(project: Project, wireId: string) {
  return { ...project, wires: project.wires.map((wire) => lockedWire(wire, wireId)) };
}
function lockedWire(wire: Wire, id: string): Wire {
  return wire.id === id ? { ...wire, locked: true } : wire;
}

it('regenerates only explicitly selected net pins without adding missing columns or allocating their GPIOs', () => {
  const source: Project = {
    ...EMPTY,
    keys: EMPTY.keys.slice(0, 2),
    wiring: {
      kind: 'matrix',
      topology: 'unibody',
      diodeDirection: 'col2row',
      terminals: [
        { id: 't0', half: 'left', kind: 'row', boardPin: 2 },
        { id: 't1', half: 'left', kind: 'col' },
      ],
    },
    wires: [
      {
        id: 'w1',
        start: { kind: 'key-pin', keyId: 'a', pin: 1 },
        end: { kind: 'key-pin', keyId: 'b', pin: 1 },
        bends: [],
      },
      {
        id: 'w2',
        start: { kind: 'key-pin', keyId: 'a', pin: 1 },
        end: { kind: 'free', at: { xU: -2, yU: 0.3667 }, terminalId: 't0' },
        bends: [],
      },
    ],
  };
  const candidate = getResultValue(
    regenerateWiring(source, { ...INPUT, scope: { kind: 'selection', netWireIds: ['w1'] } }),
  ).project;
  expect(getWiringCells(candidate)).toEqual([
    { keyId: 'a', half: 'left', row: 0, rowPin: 1 },
    { keyId: 'b', half: 'left', row: 0, rowPin: 1 },
  ]);
  expect(candidate.wiring?.terminals).toEqual(source.wiring?.terminals);
  expect(candidate.wires).toHaveLength(3);
});

it('joins a selected missing key to an existing compatible matrix boundary while retaining outside objects', () => {
  const existing = getResultValue(
    regenerateWiring(buildProject({ keys: [{ id: 'b', xU: 1, yU: 0 }] }), INPUT),
  ).project;
  const source = { ...existing, keys: [...existing.keys, { id: 'a', xU: 0, yU: 0 }] };
  const candidate = getResultValue(
    regenerateWiring(source, { ...INPUT, scope: { kind: 'selection', keyIds: ['a'] } }),
  ).project;
  expect(candidate.wires.slice(0, source.wires.length)).toEqual(source.wires);
  expect(candidate.keys[0]).toEqual(source.keys[0]);
  expect(getWiringCells(candidate)).toEqual([
    { keyId: 'b', half: 'left', row: 0, col: 0, rowPin: 1 },
    { keyId: 'a', half: 'left', row: 0, col: 1, rowPin: 1 },
  ]);
  expect(candidate.wiring?.terminals.slice(0, 2)).toEqual(source.wiring?.terminals);
});

it('preserves a known raw GPIO on a partially wired legacy project before allocating missing terminals', () => {
  const source = {
    ...EMPTY,
    wires: [
      {
        id: 'w0',
        start: { kind: 'key-pin' as const, keyId: 'a', pin: 1 as const },
        end: { kind: 'free' as const, at: { xU: -2, yU: 0.3667 }, boardPin: 14 },
        bends: [],
      },
    ],
  };
  const before = JSON.stringify(source);
  const candidate = getResultValue(regenerateWiring(source, INPUT)).project;
  expect(candidate.wiring?.terminals[0]?.boardPin).toBe(14);
  expect(JSON.stringify(source)).toBe(before);
});

it('refuses conflicting raw GPIO assignments instead of overwriting an existing terminal pin', () => {
  const source = {
    ...EMPTY,
    wiring: {
      kind: 'matrix' as const,
      topology: 'unibody' as const,
      diodeDirection: 'col2row' as const,
      terminals: [{ id: 't0', half: 'left' as const, kind: 'row' as const, boardPin: 2 }],
    },
    wires: [
      {
        id: 'w0',
        start: { kind: 'key-pin' as const, keyId: 'a', pin: 1 as const },
        end: { kind: 'free' as const, at: { xU: -2, yU: 0.3667 }, boardPin: 14 },
        bends: [],
      },
    ],
  };
  const before = JSON.stringify(source);
  expect(regenerateWiring(source, INPUT)).toMatchObject({
    ok: false,
    error: { code: 'resources' },
  });
  expect(JSON.stringify(source)).toBe(before);
});

it('stores normalized routing distances together with the generated geometry', () => {
  const candidate = getResultValue(
    regenerateWiring(EMPTY, {
      ...INPUT,
      settings: {
        ...SETTINGS,
        offsetU: 0.15001,
        clearanceU: 0.10001,
        fallbackRowIntervalU: 1.00001,
      },
    }),
  ).project;
  expect(candidate.routing).toEqual(SETTINGS);
});

it('uses buses immediately when switching from Direct back to Matrix', () => {
  const direct = getResultValue(editWiring(EMPTY, { kind: 'mode', mode: 'direct', board: BOARD }));
  const candidate = getResultValue(
    editWiring(direct, { kind: 'mode', mode: 'matrix', board: BOARD }),
  );
  expect(candidate.routing?.matrixStyle).toBe('symmetric-bus');
  expect(candidate.wires.some((wire) => wire.end.kind === 'junction')).toBe(true);
});
