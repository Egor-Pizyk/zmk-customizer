import { expect, it } from 'vitest';
import { editWiring } from '@domain/wiring/editing';
import { deriveWiring } from '@domain/wiring/matrix';
import type { Project } from '@domain';
import { getControllerFixtures } from '../../../../helpers/controller-fixtures';
import { getDefinedValue } from '../../../../helpers/defined-value';
import { getResultValue, getResultError } from '../../../../helpers/result';

const { project: fixture, boards } = getControllerFixtures();
const board = getDefinedValue(boards[0]);
function auto(project: Project, gridStepU = 1) {
  return editWiring(project, { kind: 'auto', gridStepU, board });
}
function unwired(): Project {
  return { ...fixture, wires: [], insulatedCrossings: [] };
}

it('allocates exact catalog-order GPIOs, preserves pins and is deterministic without mutating inputs', () => {
  const project = unwired();
  const before = structuredClone(project);
  const proposed = getResultValue(auto(project));
  expect(proposed.wiring?.terminals.map((terminal) => terminal.boardPin)).toEqual([0, 1, 2, 3, 4]);
  expect(deriveWiring(proposed, board).ok).toBe(true);
  expect(getResultValue(auto(project))).toEqual(proposed);
  expect(project).toEqual(before);
  const initialized = getResultValue(editWiring(fixture, { kind: 'initialize', board }));
  const retained = getResultValue(auto(initialized));
  expect(retained.wiring?.terminals).toEqual(initialized.wiring?.terminals);
  expect(retained.layers).toEqual(initialized.layers);
});

it('reserves encoders and disconnected manual circuits, while replacing key-connected nets', () => {
  const manual = {
    id: 'manual',
    start: { kind: 'free' as const, at: { xU: 40, yU: 40 }, boardPin: 2 },
    end: { kind: 'free' as const, at: { xU: 41, yU: 40 } },
    bends: [],
  };
  const project = {
    ...unwired(),
    encoders: [
      {
        id: 'e0',
        xU: 50,
        yU: 50,
        half: 'left' as const,
        aPin: 0,
        bPin: 1,
        steps: 20,
        triggersPerRotation: 20,
      },
    ],
    wires: [manual],
  };
  const proposed = getResultValue(auto(project));
  expect(proposed.wiring?.terminals.map((terminal) => terminal.boardPin)).toEqual([3, 4, 5, 6, 7]);
  expect(proposed.wires).toContainEqual(manual);
});

it('refuses unavailable, dropped or duplicate existing GPIOs and encoder conflicts atomically', () => {
  const initialized = getResultValue(editWiring(fixture, { kind: 'initialize', board }));
  const terminals = getDefinedValue(initialized.wiring).terminals;
  for (const boardPin of [99, getDefinedValue(terminals[1]?.boardPin)]) {
    const project = {
      ...initialized,
      wiring: {
        ...getDefinedValue(initialized.wiring),
        terminals: [{ ...getDefinedValue(terminals[0]), boardPin }, ...terminals.slice(1)],
      },
    };
    const before = structuredClone(project);
    expect(auto(project).ok).toBe(false);
    expect(project).toEqual(before);
  }
  const dropped = {
    ...initialized,
    wiring: {
      ...getDefinedValue(initialized.wiring),
      terminals: [
        { ...getDefinedValue(terminals[0]), droppedBoardPin: 'P9' },
        ...terminals.slice(1),
      ],
    },
  };
  expect(auto(dropped).ok).toBe(false);
});

it('reports insufficient free pins including encoder usage and does not change the project', () => {
  const project = {
    ...unwired(),
    encoders: [
      {
        id: 'e0',
        xU: 40,
        yU: 40,
        half: 'left' as const,
        aPin: 0,
        bPin: 1,
        steps: 20,
        triggersPerRotation: 20,
      },
    ],
  };
  const result = editWiring(project, {
    kind: 'auto',
    gridStepU: 1,
    board: { ...board, gpioPins: [0, 1, 2, 3, 4, 5] },
  });
  expect(getResultError(result)).toMatch(/left.*5.*4/iu);
  expect(project.wires).toEqual([]);
});

it('assigns direct inputs without assigning a GPIO to ground', () => {
  const direct = getResultValue(editWiring(unwired(), { kind: 'mode', mode: 'direct', board }));
  const proposed = getResultValue(auto(direct));
  expect(
    proposed.wiring?.terminals
      .filter((terminal) => terminal.kind === 'input')
      .map((terminal) => terminal.boardPin),
  ).toEqual([0, 1, 2, 3, 4, 5]);
  expect(
    proposed.wiring?.terminals.find((terminal) => terminal.kind === 'ground')?.boardPin,
  ).toBeUndefined();
  expect(deriveWiring(proposed, board).ok).toBe(true);
});

for (const pins of [
  [99, 98],
  [0, 0],
  [2, 3],
]) {
  it(`refuses invalid/conflicting occupied encoder pins ${pins.join(',')}`, () => {
    const project = {
      ...fixture,
      encoders: [
        {
          id: 'e0',
          xU: 40,
          yU: 40,
          half: 'left' as const,
          aPin: getDefinedValue(pins[0]),
          bPin: getDefinedValue(pins[1]),
          steps: 20,
          triggersPerRotation: 20,
        },
      ],
    };
    expect(auto(project).ok).toBe(false);
  });
}

it('keeps split export valid after moving one key between halves through a preview', () => {
  let project = getResultValue(editWiring(fixture, { kind: 'topology', topology: 'split', board }));
  for (const half of ['left', 'right'] as const) {
    for (const [index, terminal] of getDefinedValue(project.wiring)
      .terminals.filter((entry) => entry.half === half)
      .entries()) {
      project = getResultValue(
        editWiring(project, { kind: 'pin', terminalId: terminal.id, boardPin: index, board }),
      );
    }
  }
  project = getResultValue(
    editWiring(project, { kind: 'dimensions', half: 'left', rows: 2, cols: 3, board }),
  );
  project = getResultValue(
    editWiring(project, { kind: 'cell', keyId: 'k2', half: 'left', row: 0, col: 0, board }),
  );
  project = getResultValue(
    editWiring(project, { kind: 'cell', keyId: 'k2', half: 'left', row: 0, col: 2, board }),
  );
  const terminal = getDefinedValue(
    project.wiring?.terminals
      .filter((entry) => entry.half === 'left')
      .filter((entry) => entry.kind === 'col')[2],
  );
  project = getResultValue(
    editWiring(project, { kind: 'pin', terminalId: terminal.id, boardPin: 4, board }),
  );
  expect(getResultValue(deriveWiring(project, board)).cells).toHaveLength(6);
});

it('refuses unavailable legacy wire GPIOs before replacing their circuit', () => {
  const first = getDefinedValue(fixture.wires[0]);
  const project = {
    ...fixture,
    wires: [
      { ...first, end: { kind: 'free' as const, at: { xU: -1, yU: 0.3667 }, boardPin: 99 } },
      ...fixture.wires.slice(1),
    ],
  };
  expect(auto(project).ok).toBe(false);
});
