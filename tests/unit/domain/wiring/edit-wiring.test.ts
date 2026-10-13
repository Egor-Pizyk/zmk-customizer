import { expect, it } from 'vitest';
import type { Key } from '@domain';
import { getControllerFixtures } from '../../../helpers/controller-fixtures';
import { getDefinedValue } from '../../../helpers/defined-value';
import { getResultValue, getResultError } from '../../../helpers/result';
import { editWiring, deriveWiring, getNets } from '@domain';

const { project: UNIBODY_PRESET, boards: CONTROLLER_BOARDS } = getControllerFixtures();
const board = getDefinedValue(CONTROLLER_BOARDS[0]);
it('keeps legacy nets and cell order while pin edits retain axis identity', () => {
  const project = getResultValue(editWiring(UNIBODY_PRESET, { kind: 'initialize', board }));
  expect(project.wires.map((wire) => wire.bends)).toEqual(
    UNIBODY_PRESET.wires.map((wire) => wire.bends),
  );
  const before = getResultValue(deriveWiring(project, board));
  const terminal = getDefinedValue(project.wiring?.terminals.find((entry) => entry.kind === 'row'));
  const changed = getResultValue(
    editWiring(project, { kind: 'pin', terminalId: terminal.id, boardPin: 21, board }),
  );
  expect(getResultValue(deriveWiring(changed, board)).cells).toEqual(before.cells);
  expect(getResultValue(deriveWiring(changed, board)).rowPins[0]).toBe(21);
});
it('moves a key by changing actual connected nets, leaving geometry and bindings intact', () => {
  const project = getResultValue(editWiring(UNIBODY_PRESET, { kind: 'initialize', board }));
  const changed = getResultValue(
    editWiring(project, { kind: 'cell', keyId: 'k0', row: 1, col: 0, half: 'left', board }),
  );
  const net = getNets(changed).find((entry) =>
    entry.pins.some((pin) => [pin.keyId, pin.pin].join(':') === 'k0:1'),
  );
  expect(getDefinedValue(net).pins).toContainEqual({ keyId: 'k3', pin: 1 });
  expect(changed.layers).toEqual(project.layers);
  expect(changed.keys).toEqual(project.keys);
  expect(deriveWiring(changed, board).ok).toBe(false);
});
it('routes a direct circuit to real ground and permits duplicate GPIO across split halves only', () => {
  const direct = getResultValue(
    editWiring(UNIBODY_PRESET, { kind: 'mode', mode: 'direct', board }),
  );
  expect(direct.keys.every((key) => key.diode === undefined)).toBe(true);
  expect(
    getDefinedValue(
      getNets(direct).find((net) =>
        net.terminalIds.some((id) =>
          getDefinedValue(direct.wiring).terminals.some(
            (terminal) => [terminal.id, terminal.kind].join(':') === `${id}:ground`,
          ),
        ),
      ),
    ).pins,
  ).toHaveLength(6);
  let split = getResultValue(editWiring(direct, { kind: 'topology', topology: 'split', board }));
  expect(split.keys.map((key) => key.half)).toEqual([
    'left',
    'left',
    'right',
    'left',
    'left',
    'right',
  ]);
  for (const half of ['left', 'right'] as const) {
    for (const [index, terminal] of getDefinedValue(split.wiring)
      .terminals.filter((entry) => [entry.half, entry.kind].join(':') === `${half}:input`)
      .entries()) {
      split = getResultValue(
        editWiring(split, { kind: 'pin', terminalId: terminal.id, boardPin: index, board }),
      );
    }
  }
  expect(
    getDefinedValue(getResultValue(deriveWiring(split, board)).halves).right.colPins,
  ).toHaveLength(2);
});

it('blocks direct export when a manual diode has been added', () => {
  const direct = getResultValue(
    editWiring(UNIBODY_PRESET, { kind: 'mode', mode: 'direct', board }),
  );
  const changed = {
    ...direct,
    keys: direct.keys.map(withDirectDiode),
  };
  const result = deriveWiring(changed, board);
  expect(result.ok).toBe(false);
  expect(getResultError(result).map((issue) => issue.code)).toContain('matrix-diode-conflict');
});

function withDirectDiode(key: Key) {
  return { ...key, diode: { pin: 1 as const, cathode: 'toward-switch' as const } };
}

it('keeps no-op dimensions and direction identical and rejects truncating occupied rows', () => {
  const initialized = getResultValue(editWiring(UNIBODY_PRESET, { kind: 'initialize', board }));
  expect(
    getResultValue(
      editWiring(initialized, { kind: 'dimensions', half: 'left', rows: 2, cols: 3, board }),
    ),
  ).toBe(initialized);
  expect(
    getResultValue(editWiring(initialized, { kind: 'direction', direction: 'col2row', board })),
  ).toBe(initialized);
  expect(
    editWiring(initialized, { kind: 'dimensions', half: 'left', rows: 1, cols: 3, board }).ok,
  ).toBe(false);
});

it('auto assigns and reverses both diode polarities while preserving physical data', () => {
  const initialized = getResultValue(editWiring(UNIBODY_PRESET, { kind: 'initialize', board }));
  const auto = getResultValue(editWiring(initialized, { kind: 'auto', gridStepU: 0.25, board }));
  expect(auto.keys).toEqual(initialized.keys);
  expect(auto.layers).toEqual(initialized.layers);
  expect(getResultValue(deriveWiring(auto, board)).cells).toEqual(
    getResultValue(deriveWiring(initialized, board)).cells,
  );
  const reversed = getResultValue(
    editWiring(auto, { kind: 'direction', direction: 'row2col', board }),
  );
  expect(reversed.keys.map((key) => key.diode?.cathode)).toEqual(
    Array.from({ length: 6 }, () => 'toward-switch'),
  );
  expect(
    getResultValue(editWiring(reversed, { kind: 'direction', direction: 'col2row', board })).keys,
  ).toEqual(auto.keys);
});
it('rejects invalid cells and USB split without changing the circuit', () => {
  const initialized = getResultValue(editWiring(UNIBODY_PRESET, { kind: 'initialize', board }));
  expect(
    editWiring(initialized, { kind: 'cell', keyId: 'k0', row: -1, col: 0, half: 'left', board }).ok,
  ).toBe(false);
  expect(
    getResultValue(
      editWiring(initialized, { kind: 'cell', keyId: 'k0', row: 0, col: 0, half: 'left', board }),
    ),
  ).toBe(initialized);
  expect(
    editWiring(initialized, {
      kind: 'topology',
      topology: 'split',
      board: { ...board, ble: false },
    }).ok,
  ).toBe(false);
  expect(
    editWiring(initialized, { kind: 'dimensions', rows: 256, cols: 3, half: 'left', board }).ok,
  ).toBe(false);
});
it('resizes axes without truncating keys and clears unavailable assignments explicitly', () => {
  const initialized = getResultValue(editWiring(UNIBODY_PRESET, { kind: 'initialize', board }));
  const expanded = getResultValue(
    editWiring(initialized, { kind: 'dimensions', rows: 3, cols: 4, half: 'left', board }),
  );
  expect(getDefinedValue(expanded.wiring).terminals.map((terminal) => terminal.kind)).toEqual([
    'row',
    'row',
    'row',
    'col',
    'col',
    'col',
    'col',
  ]);
  expect(expanded.keys).toEqual(initialized.keys);
  const cleared = getResultValue(
    editWiring(initialized, { kind: 'pin', terminalId: 't0', boardPin: undefined, board }),
  );
  expect(getDefinedValue(cleared.wiring).terminals[0]).toEqual({
    id: 't0',
    half: 'left',
    kind: 'row',
  });
  expect(
    getResultValue(
      editWiring(cleared, { kind: 'pin', terminalId: 't0', boardPin: undefined, board }),
    ),
  ).toBe(cleared);
  expect(
    getResultValue(
      editWiring(initialized, { kind: 'pin', terminalId: 'missing', boardPin: 0, board }),
    ),
  ).toBe(initialized);
});

it('refuses dimensions that require more independent GPIOs than the selected board exposes', () => {
  expect(
    editWiring(UNIBODY_PRESET, { kind: 'dimensions', half: 'left', rows: 32, cols: 32, board }).ok,
  ).toBe(false);
});
