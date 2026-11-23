import { expect, it } from 'vitest';
import { getBoardPinLabels } from '@ui/canvas/logic';
import { getRoutingSettings } from '@domain/wiring';
import type { Project } from '@domain';
import { buildProject } from '../../../../helpers/build-project';

it('keeps labels short for compact buses and retains legacy labels for old layouts', () => {
  const source: Project = {
    ...buildProject({
      keys: [{ id: 'k0', xU: 0, yU: 0 }],
      wires: [
        {
          id: 'w0',
          start: { kind: 'free', terminalId: 't0', at: { xU: -2.5, yU: 0 } },
          end: { kind: 'free', at: { xU: 0.3, yU: 0 } },
          bends: [],
        },
        {
          id: 'w1',
          start: { kind: 'free', terminalId: 't1', at: { xU: 0.6333, yU: -0.5 } },
          end: { kind: 'key-pin', keyId: 'k0', pin: 2 },
          bends: [],
        },
      ],
    }),
    wiring: {
      kind: 'matrix',
      topology: 'unibody',
      diodeDirection: 'col2row',
      terminals: [
        { id: 't0', half: 'left', kind: 'row', boardPin: 0 },
        { id: 't1', half: 'left', kind: 'col', boardPin: 1 },
      ],
    },
  };
  expect(getBoardPinLabels(source).map((label) => label.label)).toEqual([
    'left row t0 D0',
    'left col t1 D1',
  ]);
  expect(
    getBoardPinLabels({
      ...source,
      routing: { ...getRoutingSettings(source), matrixStyle: 'symmetric-bus' },
    }).map((label) => label.label),
  ).toEqual(['R0 D0', 'C0 D1']);
  expect(
    getBoardPinLabels({
      ...source,
      routing: { ...getRoutingSettings(source), matrixStyle: 'symmetric-bus' },
    }).map((label) => label.aboveWire),
  ).toEqual([true, undefined]);
});
