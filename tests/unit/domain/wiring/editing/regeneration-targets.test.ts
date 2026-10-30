import { expect, it } from 'vitest';
import type { Wire } from '@domain';
import { createWiringTargets, resolveWiringScope } from '@domain/wiring/editing';
import { buildProject, freeEnd, keyPin } from '../../../../helpers/build-project';
import { getResultValue } from '../../../../helpers/result';

const project = buildProject({
  keys: [
    { id: 'a', xU: 0, yU: 0, half: 'left' },
    { id: 'b', xU: 1, yU: 0, half: 'left' },
    { id: 'c', xU: 4, yU: 0, half: 'right' },
  ],
  wires: [
    { id: 'shared', start: keyPin('a', 1), end: keyPin('b', 1), bends: [] },
    { id: 'own', start: keyPin('a', 2), end: freeEnd(0, -1), bends: [] },
    {
      id: 'right',
      half: 'right',
      start: keyPin('c', 1),
      end: freeEnd(4, -1),
      bends: [],
      locked: true,
    },
  ],
});

it('resolves all and half scopes without moving a locked wire into the editable set', () => {
  expect(getResultValue(resolveWiringScope(project, { kind: 'all' }))).toEqual({
    keyIds: ['a', 'b', 'c'],
    pinIds: ['a:1', 'a:2', 'b:1', 'b:2', 'c:1', 'c:2'],
    wireIds: ['own', 'shared'],
    fixedWireIds: ['right'],
  });
  expect(getResultValue(resolveWiringScope(project, { kind: 'half', half: 'left' }))).toEqual({
    keyIds: ['a', 'b'],
    pinIds: ['a:1', 'a:2', 'b:1', 'b:2'],
    wireIds: ['own', 'shared'],
    fixedWireIds: ['right'],
  });
});

it('keeps a shared conductor fixed instead of silently expanding a selected key scope', () => {
  expect(getResultValue(resolveWiringScope(project, { kind: 'selection', keyIds: ['a'] }))).toEqual(
    {
      keyIds: ['a'],
      pinIds: ['a:1', 'a:2'],
      wireIds: ['own'],
      fixedWireIds: ['right', 'shared'],
    },
  );
  expect(project.wires[0]?.end).toEqual(keyPin('b', 1));
});

it('expands only explicitly selected electrical nets and normalizes duplicate selection IDs', () => {
  expect(
    getResultValue(
      resolveWiringScope(project, {
        kind: 'selection',
        keyIds: ['a', 'a'],
        netWireIds: ['shared', 'shared'],
      }),
    ),
  ).toEqual({
    keyIds: ['a', 'b'],
    pinIds: ['a:1', 'a:2', 'b:1'],
    wireIds: ['own', 'shared'],
    fixedWireIds: ['right'],
  });
});

it('rejects missing selection references and empty selections atomically', () => {
  expect(resolveWiringScope(project, { kind: 'selection', keyIds: ['missing'] }).ok).toBe(false);
  expect(resolveWiringScope(project, { kind: 'selection', netWireIds: ['missing'] }).ok).toBe(
    false,
  );
  expect(resolveWiringScope(project, { kind: 'selection' }).ok).toBe(false);
});

it('treats pooled inline contacts outside the selected keys as a fixed boundary', () => {
  const pooled = {
    ...project,
    wireContacts: [{ keyId: 'b', pin: 2 as const, at: { xU: 0, yU: -1 } }],
    wires: withPooledContact(),
  };
  expect(getResultValue(resolveWiringScope(pooled, { kind: 'selection', keyIds: ['a'] }))).toEqual({
    keyIds: ['a'],
    pinIds: ['a:1', 'a:2'],
    wireIds: [],
    fixedWireIds: ['own', 'right', 'shared'],
  });
});

const matrix = {
  ...project,
  wiring: {
    kind: 'matrix' as const,
    topology: 'split' as const,
    diodeDirection: 'col2row' as const,
    terminals: [
      { id: 'r0', half: 'left' as const, kind: 'row' as const, boardPin: 2 },
      { id: 'r1', half: 'left' as const, kind: 'row' as const, boardPin: 3 },
      { id: 'c0', half: 'left' as const, kind: 'col' as const, boardPin: 4 },
    ],
  },
  wires: [
    {
      id: 'row',
      start: keyPin('a', 1),
      end: { kind: 'free' as const, at: { xU: -1, yU: 0 }, terminalId: 'r1' },
      bends: [],
    },
    {
      id: 'col',
      start: keyPin('a', 2),
      end: { kind: 'free' as const, at: { xU: 0, yU: -1 }, terminalId: 'c0' },
      bends: [],
    },
  ],
};

it('preserves actual logical assignment despite screen position and persisted desired cells', () => {
  const source = {
    ...matrix,
    routing: {
      matrixStyle: 'symmetric-bus' as const,
      offsetU: 0.15,
      clearanceU: 0.1,
      fallbackRowIntervalU: 1,
      preferredScope: 'all' as const,
      targetCells: [{ keyId: 'a', half: 'left' as const, row: 0, col: 2 }],
    },
  };
  const before = JSON.stringify(source);
  const result = getResultValue(createWiringTargets(source, { scope: { kind: 'all' } }));
  expect(result.cells.find((cell) => cell.keyId === 'a')).toEqual({
    keyId: 'a',
    half: 'left',
    row: 1,
    col: 0,
    rowPin: 1,
  });
  expect(result.proposedKeyIds).toEqual(['b', 'c']);
  expect(JSON.stringify(source)).toBe(before);
  expect(source.wiring.terminals.map((terminal) => terminal.boardPin)).toEqual([2, 3, 4]);
});

it('proposes empty-schematic assignments explicitly and leaves outside keys unassigned', () => {
  const empty = { ...project, wires: [] };
  const result = getResultValue(
    createWiringTargets(empty, {
      scope: { kind: 'selection', keyIds: ['b', 'a'] },
    }),
  );
  expect(result.cells).toEqual([
    { keyId: 'a', half: 'left', row: 0, col: 0, rowPin: 1 },
    { keyId: 'b', half: 'left', row: 0, col: 1, rowPin: 1 },
    { keyId: 'c', half: 'right' },
  ]);
  expect(result.proposedKeyIds).toEqual(['a', 'b']);
  expect(empty.wires).toEqual([]);
});

it('uses explicit desired assignments only inside the requested scope', () => {
  const result = getResultValue(
    createWiringTargets(matrix, {
      scope: { kind: 'selection', keyIds: ['a'] },
      cells: [{ keyId: 'a', half: 'left', row: 0, col: 2 }],
    }),
  );
  expect(result.cells[0]).toEqual({ keyId: 'a', half: 'left', row: 0, col: 2, rowPin: 1 });
  expect(
    createWiringTargets(matrix, {
      scope: { kind: 'selection', keyIds: ['a'] },
      cells: [{ keyId: 'b', half: 'left', row: 0, col: 2 }],
    }).ok,
  ).toBe(false);
});

function withPooledContact() {
  return project.wires.map(addContact);
}

function addContact(wire: Wire): Wire {
  return wire.id === 'own' ? { ...wire, contactIds: [0] } : wire;
}

it('preserves a partially known row and physical row pin while proposing the missing column', () => {
  const partial = {
    ...matrix,
    wires: [
      ...matrix.wires,
      {
        id: 'partial',
        start: keyPin('b', 2),
        end: { kind: 'free' as const, at: { xU: 2, yU: 0 }, terminalId: 'r1' },
        bends: [],
      },
    ],
  };
  const result = getResultValue(createWiringTargets(partial, { scope: { kind: 'all' } }));
  expect(result.cells.find((cell) => cell.keyId === 'b')).toEqual({
    keyId: 'b',
    half: 'left',
    row: 1,
    col: 1,
    rowPin: 2,
  });
  expect(result.proposedKeyIds).toEqual(['b', 'c']);
});

it('refuses conflicting explicit matrix cells without renumbering known assignments', () => {
  const before = JSON.stringify(matrix);
  expect(
    createWiringTargets(matrix, {
      scope: { kind: 'all' },
      cells: [{ keyId: 'b', half: 'left', row: 1, col: 0 }],
    }).ok,
  ).toBe(false);
  expect(JSON.stringify(matrix)).toBe(before);
});

it('keeps a conductor spanning halves fixed even when its explicit half matches the scope', () => {
  const crossHalf = {
    ...project,
    wires: [
      {
        id: 'cross',
        half: 'left' as const,
        start: keyPin('a', 1),
        end: keyPin('c', 1),
        bends: [],
      },
    ],
  };
  expect(getResultValue(resolveWiringScope(crossHalf, { kind: 'half', half: 'left' }))).toEqual({
    keyIds: ['a', 'b'],
    pinIds: ['a:1', 'a:2', 'b:1', 'b:2'],
    wireIds: [],
    fixedWireIds: ['cross'],
  });
});

it('selects only the named net when no keys are explicitly selected', () => {
  expect(
    getResultValue(
      resolveWiringScope(project, {
        kind: 'selection',
        netWireIds: ['shared'],
      }),
    ),
  ).toEqual({
    keyIds: ['a', 'b'],
    pinIds: ['a:1', 'b:1'],
    wireIds: ['shared'],
    fixedWireIds: ['own', 'right'],
  });
});

it('refuses ambiguous actual assignments instead of choosing one terminal from an existing short', () => {
  const shorted = {
    ...matrix,
    wires: [
      {
        id: 'w0',
        start: keyPin('a', 1),
        end: { kind: 'free' as const, at: { xU: -1, yU: 0 }, terminalId: 'r0' },
        bends: [],
      },
      {
        id: 'w1',
        start: keyPin('a', 1),
        end: { kind: 'free' as const, at: { xU: 0, yU: -1 }, terminalId: 'c0' },
        bends: [],
      },
    ],
  };
  expect(createWiringTargets(shorted, { scope: { kind: 'all' } }).ok).toBe(false);
});
