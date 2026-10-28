import { expect, it } from 'vitest';
import { createMatrixBusRoutes } from '@domain/wiring/editing';
import type { Key, Project, RoutingSettings, Wiring, WiringTerminal } from '@domain';
import type { WiringCell } from '@domain/wiring/matrix';
import { buildProject } from '../../../../helpers/build-project';
import { getResultValue } from '../../../../helpers/result';

const SETTINGS: RoutingSettings = {
  matrixStyle: 'symmetric-bus',
  offsetU: 0.15,
  clearanceU: 0.1,
  fallbackRowIntervalU: 1,
  preferredScope: 'all',
};
const CELLS = [
  { keyId: 'k0', half: 'left', row: 0, col: 0 },
  { keyId: 'k1', half: 'left', row: 0, col: 1 },
  { keyId: 'k2', half: 'left', row: 1, col: 0 },
  { keyId: 'k3', half: 'left', row: 1, col: 1 },
] as const;
const KEYS = [
  { id: 'k0', xU: 0, yU: 0 },
  { id: 'k1', xU: 1, yU: 0 },
  { id: 'k2', xU: 0, yU: 1 },
  { id: 'k3', xU: 1, yU: 1 },
];

it('places regular row buses between key centers and columns through the upper pins', () => {
  const project = matrix(KEYS, CELLS);
  const routes = getResultValue(
    createMatrixBusRoutes(project, { cells: CELLS, settings: SETTINGS }),
  );
  expect(routes.map(({ kind, index, line }) => ({ kind, index, line }))).toEqual([
    {
      kind: 'row',
      index: 0,
      line: [
        { xU: 0.15, yU: 0 },
        { xU: 1.3, yU: 0 },
      ],
    },
    {
      kind: 'row',
      index: 1,
      line: [
        { xU: 0.15, yU: 1 },
        { xU: 1.3, yU: 1 },
      ],
    },
    {
      kind: 'col',
      index: 0,
      line: [
        { xU: 0.6333, yU: -0.15 },
        { xU: 0.6333, yU: 1.2333 },
      ],
    },
    {
      kind: 'col',
      index: 1,
      line: [
        { xU: 1.6333, yU: -0.15 },
        { xU: 1.6333, yU: 1.2333 },
      ],
    },
  ]);
  expect(routes[0]?.branches).toEqual([
    {
      keyId: 'k0',
      pin: 1,
      pinAt: { xU: 0.3, yU: 0.3667 },
      busAt: { xU: 0.3, yU: 0 },
      requiresDetour: false,
    },
    {
      keyId: 'k1',
      pin: 1,
      pinAt: { xU: 1.3, yU: 0.3667 },
      busAt: { xU: 1.3, yU: 0 },
      requiresDetour: false,
    },
  ]);
  expect(project.wires).toHaveLength(0);
});

it('uses the mean of positive distinct row gaps for the top row and keeps logical holes', () => {
  const cells = [
    { keyId: 'k0', half: 'left', row: 0, col: 0 },
    { keyId: 'k1', half: 'left', row: 2, col: 0 },
    { keyId: 'k2', half: 'left', row: 4, col: 0 },
  ] as const;
  const project = matrix(
    [
      { id: 'k0', xU: 0, yU: -0.5 },
      { id: 'k1', xU: 0, yU: 0.5 },
      { id: 'k2', xU: 0, yU: 2.5 },
    ],
    cells,
  );
  const routes = getResultValue(createMatrixBusRoutes(project, { cells, settings: SETTINGS }));
  expect(
    routes.filter((route) => route.kind === 'row').map((route) => [route.index, route.line[0].yU]),
  ).toEqual([
    [0, -0.75],
    [2, 0.5],
    [4, 2],
  ]);
});

it('uses a one-unit fallback for a single row and the even median for irregular keys', () => {
  const cells = [
    { keyId: 'k0', half: 'left', row: 0, col: 0 },
    { keyId: 'k1', half: 'left', row: 0, col: 1 },
  ] as const;
  const project = matrix(
    [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 2, yU: 2, widthU: 2 },
    ],
    cells,
  );
  const routes = getResultValue(createMatrixBusRoutes(project, { cells, settings: SETTINGS }));
  expect(routes[0]?.line).toEqual([
    { xU: 0.15, yU: 1 },
    { xU: 2.8, yU: 1 },
  ]);
  expect(routes[0]?.branches[0]?.requiresDetour).toBe(true);
});

it('offsets staggered columns outward and mirrors the direction on the right half', () => {
  const cells = [
    { keyId: 'l0', half: 'left', row: 0, col: 0 },
    { keyId: 'l1', half: 'left', row: 1, col: 0 },
    { keyId: 'r0', half: 'right', row: 0, col: 0 },
    { keyId: 'r1', half: 'right', row: 1, col: 0 },
  ] as const;
  const project = matrix(
    [
      { id: 'l0', xU: 0, yU: 0 },
      { id: 'l1', xU: 0.25, yU: 1 },
      { id: 'r0', xU: 5, yU: 0, half: 'right' },
      { id: 'r1', xU: 4.75, yU: 1, half: 'right' },
    ],
    cells,
  );
  const routes = getResultValue(createMatrixBusRoutes(project, { cells, settings: SETTINGS }));
  expect(
    routes.filter((route) => route.kind === 'col').map((route) => [route.half, route.line[0].xU]),
  ).toEqual([
    ['left', 0.4833],
    ['right', 5.7833],
  ]);
});

it('resolves rotated pins after their key transform and obeys the assigned row pin', () => {
  const cells = [{ keyId: 'k0', half: 'left', row: 0, col: 0, rowPin: 2 }] as const;
  const project = matrix(
    [{ id: 'k0', xU: 0, yU: 0, rotationDeg: 90, rotationOriginXU: 0.5, rotationOriginYU: 0.5 }],
    cells,
  );
  const routes = getResultValue(createMatrixBusRoutes(project, { cells, settings: SETTINGS }));
  expect(routes[0]?.branches[0]).toMatchObject({
    pin: 2,
    pinAt: { xU: 0.7667, yU: 0.6333 },
    busAt: { xU: 0.7667, yU: 0 },
  });
  expect(routes[1]?.branches[0]).toMatchObject({ pin: 1, pinAt: { xU: 0.6333, yU: 0.3 } });
});

it('keeps equal-height logical rows separate and is independent of input cell order', () => {
  const cells = [
    { keyId: 'k0', half: 'left', row: 0, col: 0 },
    { keyId: 'k1', half: 'left', row: 1, col: 0 },
  ] as const;
  const project = matrix(
    [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 2, yU: 0 },
    ],
    cells,
  );
  const routes = getResultValue(createMatrixBusRoutes(project, { cells, settings: SETTINGS }));
  expect(
    routes
      .filter((route) => route.kind === 'row')
      .map((route) => [route.terminalId, route.line[0].yU]),
  ).toEqual([
    ['left-row-0', 0],
    ['left-row-1', 0],
  ]);
  expect(
    getResultValue(
      createMatrixBusRoutes(project, { cells: cells.toReversed(), settings: SETTINGS }),
    ),
  ).toEqual(routes);
});

function matrix(
  keys: readonly Key[],
  cells: readonly WiringCell[],
): Project & { readonly wiring: Wiring } {
  const terminals: WiringTerminal[] = [];
  for (const half of ['left', 'right'] as const) {
    for (const kind of ['row', 'col'] as const) {
      const max = Math.max(
        -1,
        ...cells.filter((cell) => cell.half === half).map((cell) => cell[kind] ?? -1),
      );
      for (let index = 0; index <= max; index += 1) {
        terminals.push({ id: `${half}-${kind}-${index}`, half, kind });
      }
    }
  }
  return {
    ...buildProject({ keys }),
    wiring: { kind: 'matrix', topology: 'split', diodeDirection: 'col2row', terminals },
  };
}

it.each([
  { rotationDeg: 30, rowPinAt: { xU: 0.3935, yU: 0.2845 }, colPinAt: { xU: 0.7488, yU: 0.3357 } },
  { rotationDeg: 180, rowPinAt: { xU: 0.7, yU: 0.6333 }, colPinAt: { xU: 0.3667, yU: 0.7667 } },
])(
  'uses hand-computed physical pin positions at $rotationDeg degrees',
  ({ rotationDeg, rowPinAt, colPinAt }) => {
    const cells = [{ keyId: 'k0', half: 'left', row: 0, col: 0 }] as const;
    const project = matrix(
      [{ id: 'k0', xU: 0, yU: 0, rotationDeg, rotationOriginXU: 0.5, rotationOriginYU: 0.5 }],
      cells,
    );
    const routes = getResultValue(createMatrixBusRoutes(project, { cells, settings: SETTINGS }));
    expect(routes[0]?.branches[0]?.pinAt).toEqual(rowPinAt);
    expect(routes[1]?.branches[0]?.pinAt).toEqual(colPinAt);
  },
);

it('keeps an irregular thumb cluster in its logical row without moving or resizing any key', () => {
  const cells = [
    { keyId: 'k0', half: 'left', row: 0, col: 0 },
    { keyId: 'k1', half: 'left', row: 0, col: 1 },
    { keyId: 'k2', half: 'left', row: 0, col: 2 },
    { keyId: 'thumb', half: 'left', row: 0, col: 3 },
  ] as const;
  const project = matrix(
    [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 1, yU: 0 },
      { id: 'k2', xU: 2, yU: 0 },
      { id: 'thumb', xU: 3, yU: 2, widthU: 1.5, heightU: 1.5 },
    ],
    cells,
  );
  const before = structuredClone(project);
  const routes = getResultValue(createMatrixBusRoutes(project, { cells, settings: SETTINGS }));
  const rows = routes.filter((route) => route.kind === 'row');
  expect(rows).toHaveLength(1);
  expect(rows[0]?.line).toEqual([
    { xU: 0.15, yU: 0 },
    { xU: 3.55, yU: 0 },
  ]);
  expect(rows[0]?.branches.map((branch) => branch.keyId)).toEqual(['k0', 'k1', 'k2', 'thumb']);
  expect(project).toEqual(before);
});

it('refuses missing assignments and terminals rather than creating partial buses', () => {
  const cells = [{ keyId: 'k0', half: 'left', row: 0, col: 0 }] as const;
  const project = matrix([{ id: 'k0', xU: 0, yU: 0 }], cells);
  expect(
    createMatrixBusRoutes(project, {
      cells: [{ keyId: 'k0', half: 'left', col: 0 }],
      settings: SETTINGS,
    }).ok,
  ).toBe(false);
  const missing = {
    ...project,
    wiring: { ...project.wiring, terminals: project.wiring.terminals.slice(0, 1) },
  };
  expect(createMatrixBusRoutes(missing, { cells, settings: SETTINGS })).toEqual({
    ok: false,
    error: 'A logical row or column has no corresponding matrix terminal.',
  });
  expect(createMatrixBusRoutes(project, { cells, settings: { ...SETTINGS, offsetU: 0 } }).ok).toBe(
    false,
  );
});
