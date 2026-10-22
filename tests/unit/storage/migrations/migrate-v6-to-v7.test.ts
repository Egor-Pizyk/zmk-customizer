import { editWiring } from '@domain/wiring/editing';
import { getControllerBoard } from '@catalog/controllers';
import { UNIBODY_PRESET } from '../../../helpers/unibody-preset';
import { parseProjectFile } from '@storage/project';

import { getDefinedValue } from '../../../helpers/defined-value';
import { expect, it } from 'vitest';

import { getResultValue } from '../../../helpers/result';

it('loads v6 without rerouting or changing bindings and round-trips v7', () => {
  const old = { ...UNIBODY_PRESET, schemaVersion: 6 };
  const project = getResultValue(parseProjectFile(JSON.stringify(old)));
  expect(project.schemaVersion).toBe(13);
  expect(project.wires).toEqual(old.wires);
  expect(project.insulatedCrossings).toEqual(old.insulatedCrossings);
  expect(project.layers).toEqual(old.layers);
  expect(getResultValue(parseProjectFile(JSON.stringify(project)))).toEqual(project);
});
it('rejects dangling terminal references instead of stripping electrical assignments', () => {
  const project = {
    ...UNIBODY_PRESET,
    schemaVersion: 13,
    encoders: [],
    combos: [],
    macros: [],
    conditionalLayers: [],
    behaviors: [],
    firmware: {},
    wiring: { kind: 'matrix', topology: 'unibody', diodeDirection: 'col2row', terminals: [] },
    wires: [
      {
        id: 'w1',
        start: { kind: 'key-pin', keyId: 'k0', pin: 1 },
        end: { kind: 'free', at: { xU: -1, yU: 0 }, terminalId: 't1' },
        bends: [],
      },
    ],
  };
  expect(parseProjectFile(JSON.stringify(project)).ok).toBe(false);
});

it('rejects duplicate terminal ids, GPIO ground and combined endpoint assignments', () => {
  const initialized = getResultValue(
    editWiring(UNIBODY_PRESET, {
      kind: 'initialize',
      board: getControllerBoard(UNIBODY_PRESET.controllerId),
    }),
  );
  const wiring = getDefinedValue(initialized.wiring);
  expect(
    parseProjectFile(
      JSON.stringify({
        ...initialized,
        wiring: {
          ...wiring,
          terminals: [...wiring.terminals, getDefinedValue(wiring.terminals[0])],
        },
      }),
    ).ok,
  ).toBe(false);
  expect(
    parseProjectFile(
      JSON.stringify({
        ...initialized,
        wiring: { ...wiring, terminals: [{ id: 't0', half: 'left', kind: 'ground', boardPin: 0 }] },
      }),
    ).ok,
  ).toBe(false);
  expect(
    parseProjectFile(
      JSON.stringify({
        ...initialized,
        wires: [
          {
            id: 'w0',
            start: { kind: 'key-pin', keyId: 'k0', pin: 1 },
            end: { kind: 'free', at: { xU: 0, yU: 0 }, terminalId: 't0', boardPin: 0 },
            bends: [],
          },
        ],
      }),
    ).ok,
  ).toBe(false);
});

it('rejects a terminal that is simultaneously assigned and dropped', () => {
  const project = {
    ...UNIBODY_PRESET,
    wiring: {
      kind: 'matrix',
      topology: 'unibody',
      diodeDirection: 'col2row',
      terminals: [{ id: 't0', kind: 'row', half: 'left', boardPin: 0, droppedBoardPin: 'old D0' }],
    },
  };
  expect(parseProjectFile(JSON.stringify(project)).ok).toBe(false);
});

it('bounds imported matrix rendering work as well as terminal count', () => {
  const terminals = ['row', 'col'].flatMap((kind, axis) =>
    Array.from({ length: 255 }, (_value, index) => ({
      id: `t${axis * 255 + index}`,
      half: 'left',
      kind,
    })),
  );
  const project = {
    ...UNIBODY_PRESET,
    wiring: { kind: 'matrix', topology: 'unibody', diodeDirection: 'col2row', terminals },
  };
  expect(parseProjectFile(JSON.stringify(project)).ok).toBe(false);
});
