import { expect, it } from 'vitest';
import { editWiring } from '@domain/wiring/editing';
import { getControllerBoard } from '@catalog/controllers';
import { buildProject } from '../../../../helpers/build-project';
import { getResultValue } from '../../../../helpers/result';

it('completes wiring without replacing retained wires and has a true no-op', () => {
  const board = getControllerBoard('nice_nano_v2');
  const source = buildProject({
    keys: [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 1, yU: 0 },
    ],
  });
  const project = getResultValue(editWiring(source, { kind: 'complete', gridStepU: 1, board }));
  expect(project.wires.length).toBeGreaterThan(0);
  const again = getResultValue(editWiring(project, { kind: 'complete', gridStepU: 1, board }));
  expect(again).toBe(project);
  expect(again.wires[0]).toBe(project.wires[0]);
});

it('preserves a retained manual GPIO while completing the other pin', () => {
  const board = getControllerBoard('nice_nano_v2');
  const source = buildProject({
    keys: [{ id: 'k1', xU: 0, yU: 0 }],
    wires: [
      {
        id: 'w1',
        start: { kind: 'key-pin', keyId: 'k1', pin: 1 },
        end: { kind: 'free', at: { xU: -1, yU: 0.3667 }, boardPin: 4 },
        bends: [],
      },
    ],
  });
  const result = editWiring(source, { kind: 'complete', board, gridStepU: 1 });
  expect(result.ok).toBe(true);
  expect(getResultValue(result).wires[0]?.id).toBe('w1');
});

it('keeps a known column on pin one and assigns the missing row to pin two', () => {
  const source = {
    ...buildProject({
      keys: [{ id: 'k1', xU: 0, yU: 0 }],
      wires: [
        {
          id: 'w1',
          start: { kind: 'key-pin' as const, keyId: 'k1', pin: 1 as const },
          end: { kind: 'free' as const, at: { xU: -1, yU: 0.3667 }, terminalId: 't0' },
          bends: [],
        },
      ],
    }),
    wiring: {
      kind: 'matrix' as const,
      topology: 'unibody' as const,
      diodeDirection: 'col2row' as const,
      terminals: [{ id: 't0', half: 'left' as const, kind: 'col' as const, boardPin: 4 }],
    },
  };
  const next = getResultValue(
    editWiring(source, {
      kind: 'complete',
      board: getControllerBoard('nice_nano_v2'),
      gridStepU: 1,
    }),
  );
  expect(next.keys[0]?.diode?.pin).toBe(2);
  expect(next.wires[0]).toEqual(source.wires[0]);
});

it('refuses empty layouts and ambiguous manual GPIOs atomically', () => {
  const board = getControllerBoard('nice_nano_v2');
  expect(editWiring(buildProject({}), { kind: 'complete', board, gridStepU: 1 }).ok).toBe(false);
  const source = buildProject({
    keys: [{ id: 'k1', xU: 0, yU: 0 }],
    wires: [
      {
        id: 'w1',
        start: { kind: 'key-pin', keyId: 'k1', pin: 1 },
        end: { kind: 'free', at: { xU: -1, yU: 0.3667 }, boardPin: 4 },
        bends: [],
      },
      {
        id: 'w2',
        start: { kind: 'key-pin', keyId: 'k1', pin: 1 },
        end: { kind: 'free', at: { xU: -2, yU: 0.3667 }, boardPin: 5 },
        bends: [],
      },
    ],
  });
  expect(editWiring(source, { kind: 'complete', board, gridStepU: 1 }).ok).toBe(false);
  expect(source.wires).toHaveLength(2);
});

it('uses a retained diode pin for an otherwise unwired key', () => {
  const source = buildProject({
    keys: [{ id: 'k1', xU: 0, yU: 0, diode: { pin: 2, cathode: 'away-switch' } }],
  });
  const next = getResultValue(
    editWiring(source, {
      kind: 'complete',
      board: getControllerBoard('nice_nano_v2'),
      gridStepU: 1,
    }),
  );
  expect(next.wires[0]?.end).toMatchObject({ terminalId: 't1' });
});

it.each(['matrix', 'direct'] as const)(
  'completes %s scanning separately on each controller half',
  (kind) => {
    const source = {
      ...buildProject({
        keys: [
          { id: 'k1', xU: 0, yU: 0, half: 'left' },
          { id: 'k2', xU: 3, yU: 0, half: 'right' },
        ],
      }),
      wiring: {
        kind,
        topology: 'split' as const,
        diodeDirection: 'col2row' as const,
        terminals: [],
      },
    };
    const next = getResultValue(
      editWiring(source, {
        kind: 'complete',
        board: getControllerBoard('nice_nano_v2'),
        gridStepU: 1,
      }),
    );
    expect(next.wires).toHaveLength(4);
    expect(next.wiring?.terminals.map((terminal) => terminal.half)).toEqual([
      'left',
      'left',
      'right',
      'right',
    ]);
    expect(
      getResultValue(
        editWiring(next, {
          kind: 'complete',
          board: getControllerBoard('nice_nano_v2'),
          gridStepU: 1,
        }),
      ),
    ).toBe(next);
  },
);

it('refuses duplicate candidate cells without replacing retained data', () => {
  const source = buildProject({
    keys: [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 0, yU: 0 },
    ],
  });
  expect(
    editWiring(source, {
      kind: 'complete',
      board: getControllerBoard('nice_nano_v2'),
      gridStepU: 1,
    }).ok,
  ).toBe(false);
});

it('keeps terminal order and project identity for an already complete split circuit', () => {
  const board = getControllerBoard('nice_nano_v2');
  const source = {
    ...buildProject({
      keys: [
        { id: 'k1', xU: 0, yU: 0, half: 'left' },
        { id: 'k2', xU: 3, yU: 0, half: 'right' },
      ],
    }),
    wiring: {
      kind: 'matrix' as const,
      topology: 'split' as const,
      diodeDirection: 'col2row' as const,
      terminals: [],
    },
  };
  const wired = getResultValue(editWiring(source, { kind: 'complete', board, gridStepU: 1 }));
  const project = interleaveTerminals(wired);
  expect(getResultValue(editWiring(project, { kind: 'complete', board, gridStepU: 1 }))).toBe(
    project,
  );
});

function interleaveTerminals(project: ReturnType<typeof buildProject>) {
  const wiring = project.wiring;
  if (wiring === undefined) {
    throw new Error('Missing split wiring');
  }
  const terminals = [
    wiring.terminals[0],
    wiring.terminals[2],
    wiring.terminals[1],
    wiring.terminals[3],
  ].filter((terminal) => terminal !== undefined);
  return { ...project, wiring: { ...wiring, terminals } };
}
