import { expect, it } from 'vitest';
import { buildWiringProject, wiringBoard } from '../../../helpers/wiring-project';
import { getDefinedValue } from '../../../helpers/defined-value';
import { getResultValue, getResultError } from '../../../helpers/result';
import { deriveWiring, editWiring } from '@domain';
import type { Project, WiringTerminal } from '@domain';

it.each([
  {
    kind: 'matrix' as const,
    expected: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    leftWidth: 2,
  },
  {
    kind: 'direct' as const,
    expected: [
      [0, 0],
      [0, 1],
      [0, 4],
      [0, 2],
      [0, 3],
      [0, 5],
    ],
    leftWidth: 4,
  },
])(
  'derives $kind split offsets from local axes with independent GPIO namespaces',
  ({ kind, expected, leftWidth }) => {
    const project = buildWiringProject(kind, 'split');
    const matrix = getResultValue(deriveWiring(project, wiringBoard()));
    expect(matrix.cells.map((cell) => [cell.row, cell.col])).toEqual(expected);
    expect(getDefinedValue(matrix.halves).left.colPins).toHaveLength(leftWidth);
  },
);
it('reports both duplicate GPIO assignments and every unmapped key', () => {
  const project = buildWiringProject();
  const changed = mapTerminals(project, (terminal) => ({ ...terminal, boardPin: 0 }));
  expect(
    getResultError(deriveWiring(changed, wiringBoard())).filter(
      (issue) => issue.code === 'board-pin-conflict',
    ),
  ).toHaveLength(5);
  const disconnected = { ...project, wires: [] };
  expect(
    getResultError(deriveWiring(disconnected, wiringBoard()))
      .filter((issue) => issue.code === 'wiring-cell-missing')
      .map((issue) => issue.path),
  ).toEqual([0, 1, 2, 3, 4, 5].map((index) => ['keys', index]));
});
it('reports missing and unsupported pins without substituting GPIO zero', () => {
  const project = buildWiringProject();
  const missing = getResultValue(
    editWiring(project, {
      kind: 'pin',
      terminalId: 't0',
      boardPin: undefined,
      board: wiringBoard(),
    }),
  );
  expect(getResultError(deriveWiring(missing, wiringBoard())).map((issue) => issue.code)).toContain(
    'wiring-pin-missing',
  );
  const unavailable = mapTerminals(project, (terminal) => ({ ...terminal, boardPin: 31 }));
  expect(
    getResultError(deriveWiring(unavailable, wiringBoard())).map((issue) => issue.code),
  ).toContain('shield-pin-unsupported');
});
it('rejects cross-half actual connections, empty halves and USB split', () => {
  const project = buildWiringProject('matrix', 'split');
  const changed = { ...project, keys: project.keys.map(toLeft) };
  expect(getResultError(deriveWiring(changed, wiringBoard())).map((issue) => issue.code)).toContain(
    'wiring-half-conflict',
  );
  expect(getResultError(deriveWiring(changed, wiringBoard())).map((issue) => issue.code)).toContain(
    'wiring-half-empty',
  );
  expect(
    getResultError(deriveWiring(project, { ...wiringBoard(), ble: false })).map(
      (issue) => issue.code,
    ),
  ).toContain('wiring-split-unsupported');
});
function toLeft(key: Project['keys'][number]) {
  return { ...key, half: 'left' as const };
}
function mapTerminals(
  project: Project,
  map: (terminal: WiringTerminal) => WiringTerminal,
): Project {
  const wiring = getDefinedValue(project.wiring);
  return { ...project, wiring: { ...wiring, terminals: wiring.terminals.map(map) } };
}

it('rejects hidden terminals from another scan mode or unsupported unibody halves', () => {
  const project = buildWiringProject('direct');
  const wiring = getDefinedValue(project.wiring);
  const hidden = {
    ...project,
    wiring: {
      ...wiring,
      terminals: [
        ...wiring.terminals,
        { id: 't99', half: 'right' as const, kind: 'row' as const, boardPin: 21 },
      ],
    },
  };
  expect(getResultError(deriveWiring(hidden, wiringBoard())).map((issue) => issue.code)).toContain(
    'wiring-terminal-conflict',
  );
});

it('rejects invalid scan dimensions, excessive split width and contradictory diodes', () => {
  const project = buildWiringProject('matrix', 'split');
  const wiring = getDefinedValue(project.wiring);
  const tooWide = {
    ...project,
    wiring: {
      ...wiring,
      terminals: [
        ...wiring.terminals,
        ...Array.from({ length: 256 }, (_value, index) => ({
          id: `t${index + 100}`,
          half: 'right' as const,
          kind: 'col' as const,
          boardPin: index,
        })),
      ],
    },
  };
  expect(getResultError(deriveWiring(tooWide, wiringBoard())).map((issue) => issue.code)).toContain(
    'wiring-dimension-invalid',
  );
  const wrongDiodes = { ...project, keys: project.keys.map(reverseDiode) };
  expect(
    getResultError(deriveWiring(wrongDiodes, wiringBoard())).filter(
      (issue) => issue.code === 'matrix-diode-conflict',
    ),
  ).toHaveLength(6);
  const noAxes = { ...project, wiring: { ...wiring, terminals: [] } };
  expect(getResultError(deriveWiring(noAxes, wiringBoard())).map((issue) => issue.code)).toContain(
    'wiring-dimension-invalid',
  );
});
function reverseDiode(key: Project['keys'][number]) {
  return { ...key, diode: { pin: 1 as const, cathode: 'toward-switch' as const } };
}
