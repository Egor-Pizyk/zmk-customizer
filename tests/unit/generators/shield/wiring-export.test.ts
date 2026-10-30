import type { Project } from '@domain';
import type { ShieldMatrix } from '@domain/wiring/matrix';
import { generateRepositoryFiles } from '@generators/repository';
import { generateShieldFiles } from '@generators/shield';
import { SHIELD_TARGET } from '@catalog/firmware';
import { getControllerBoard } from '@catalog/controllers';
import { readFile, readdir } from 'node:fs/promises';

import { expect, it } from 'vitest';

const board = getControllerBoard('nice_nano_v2');
it.each([
  'matrix-col2row',
  'matrix-row2col',
  'direct',
  'split-matrix',
  'split-matrix-row2col',
  'split-direct',
] as const)('matches complete independent %s shield files', async (name) => {
  const { project, scan } = goldenInput(name);
  const files = generateShieldFiles(project, scan, board);
  const expectedNames = await readdir(new URL(`../../../fixtures/wiring/${name}`, import.meta.url));
  expect(files.map((file) => file.path.split('/').at(-1)).toSorted(compareNames)).toEqual(
    expectedNames.toSorted(compareNames),
  );
  const expected = await Promise.all(
    files.map(async (file) => ({
      path: file.path,
      content: await readFile(
        new URL(`../../../fixtures/wiring/${name}/${file.path.split('/').at(-1)}`, import.meta.url),
        'utf8',
      ),
    })),
  );
  expect(files).toEqual(expected);
  const repo = generateRepositoryFiles(project, {
    matrix: scan,
    target: { ...SHIELD_TARGET, ...board, boardId: board.id },
    includeWorkflow: false,
  });
  const shields = expectedShields(name);
  expect(repo.find((file) => file.path === 'build.yaml')?.content).toBe(
    `include:\n${shields.map((shield) => `  - board: nice_nano_v2\n    shield: ${shield}\n`).join('')}`,
  );
});
function goldenInput(name: string): { project: Project; scan: ShieldMatrix } {
  const direct = name.includes('direct');
  const split = name.startsWith('split');
  const kind = direct ? 'direct' : 'matrix';
  const diodeDirection = name.endsWith('row2col') ? 'row2col' : 'col2row';
  const project: Project = {
    schemaVersion: 14,
    encoders: [],
    combos: [],
    macros: [],
    conditionalLayers: [],
    behaviors: [],
    firmware: {},
    controllerId: board.id,
    name: 'Wiring sample',
    shieldName: 'wiring_sample',
    keys: [
      { id: 'k0', xU: 0, yU: 0 },
      { id: 'k1', xU: 2, yU: 2 },
      { id: 'k2', xU: 4, yU: 0 },
    ],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
    wiring: { kind, topology: split ? 'split' : 'unibody', diodeDirection, terminals: [] },
  };
  const cells = direct
    ? [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ]
    : [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
        { row: 0, col: split ? 2 : 1 },
      ];
  return {
    project,
    scan: {
      kind,
      diodeDirection,
      cells,
      rowPins: direct ? [0] : [0, 1],
      colPins: direct ? [0, 1, 2] : [2, 3, ...(split ? [1] : [])],
      ...(split
        ? {
            halves: {
              left: { rowPins: direct ? [] : [0, 1], colPins: direct ? [0, 1] : [2, 3] },
              right: { rowPins: direct ? [] : [0], colPins: direct ? [0] : [1] },
            },
          }
        : {}),
    },
  };
}

function compareNames(first: string | undefined, second: string | undefined) {
  return (first ?? '').localeCompare(second ?? '');
}

function expectedShields(name: string) {
  return name.startsWith('split')
    ? ['wiring_sample_left', 'wiring_sample_right']
    : ['wiring_sample'];
}
