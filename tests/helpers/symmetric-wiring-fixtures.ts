import type { Project } from '@domain';
import { buildProject } from './build-project';

/** Hand-computed row geometry; no production router participates in these expectations. */
export const ROW_BUS_EXAMPLES = [
  { centerYU: 0, busYU: -0.75 },
  { centerYU: 1, busYU: 0.5 },
  { centerYU: 3, busYU: 2 },
] as const;

export const SINGLE_ROW_EXAMPLE = { centerYU: 2, fallbackIntervalU: 1, busYU: 1.5 } as const;

/** Explicit pin membership distinguishes protected keys from a remote key on the same net. */
const LOCKED_PROJECT: Project = {
  ...buildProject({
    keys: [
      { id: 'k0', xU: 0, yU: 0, diode: { pin: 1, cathode: 'away-switch' } },
      { id: 'k1', xU: 2, yU: 0 },
      { id: 'k2', xU: 4, yU: 2 },
      { id: 'k3', xU: 6, yU: 2 },
    ],
  }),
  wiring: {
    kind: 'matrix',
    topology: 'unibody',
    diodeDirection: 'col2row',
    terminals: [
      { id: 't0', half: 'left', kind: 'row', boardPin: 4 },
      { id: 't1', half: 'left', kind: 'col', boardPin: 5 },
    ],
  },
  wireContacts: [{ keyId: 'k1', pin: 1, at: { xU: 2.3, yU: 0.3667 } }],
  wires: [
    {
      id: 'w0',
      locked: true,
      start: { kind: 'key-pin', keyId: 'k0', pin: 1 },
      end: { kind: 'free', terminalId: 't0', at: { xU: 8, yU: 0.3667 } },
      bends: [],
      anchors: { start: { xU: 0.3, yU: 0.3667 }, end: { xU: 8, yU: 0.3667 } },
      contactIds: [0],
    },
    {
      id: 'w1',
      start: { kind: 'key-pin', keyId: 'k2', pin: 1 },
      end: { kind: 'junction', wireId: 'w0', at: { xU: 4.3, yU: 0.3667 } },
      bends: [],
    },
    {
      id: 'w2',
      start: { kind: 'free', at: { xU: 5, yU: -1 } },
      end: { kind: 'free', at: { xU: 5, yU: 1 } },
      bends: [],
    },
  ],
  insulatedCrossings: [{ wireIds: ['w0', 'w2'], ordinal: 0 }],
};

export function buildLockedWiringProject(): Project {
  return LOCKED_PROJECT;
}
