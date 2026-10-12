import type { Project } from '../domain/types';

export const UNIBODY_WIRING = {
  wires: [
    {
      id: 'w0',
      start: {
        kind: 'key-pin',
        keyId: 'k0',
        pin: 1,
      },
      end: {
        kind: 'free',
        at: {
          xU: -1,
          yU: 0.3667,
        },
        boardPin: 2,
      },
      bends: [],
    },
    {
      id: 'w1',
      start: {
        kind: 'key-pin',
        keyId: 'k0',
        pin: 2,
      },
      end: {
        kind: 'free',
        at: {
          xU: 0.6333,
          yU: -1,
        },
        boardPin: 8,
      },
      bends: [],
    },
    {
      id: 'w2',
      start: {
        kind: 'key-pin',
        keyId: 'k1',
        pin: 1,
      },
      end: {
        kind: 'key-pin',
        keyId: 'k0',
        pin: 1,
      },
      bends: [],
    },
    {
      id: 'w3',
      start: {
        kind: 'key-pin',
        keyId: 'k1',
        pin: 2,
      },
      end: {
        kind: 'free',
        at: {
          xU: 2.6333,
          yU: -1,
        },
        boardPin: 9,
      },
      bends: [],
    },
    {
      id: 'w4',
      start: {
        kind: 'key-pin',
        keyId: 'k2',
        pin: 1,
      },
      end: {
        kind: 'key-pin',
        keyId: 'k1',
        pin: 1,
      },
      bends: [],
    },
    {
      id: 'w5',
      start: {
        kind: 'key-pin',
        keyId: 'k2',
        pin: 2,
      },
      end: {
        kind: 'free',
        at: {
          xU: 4.6333,
          yU: -1,
        },
        boardPin: 10,
      },
      bends: [],
    },
    {
      id: 'w6',
      start: {
        kind: 'key-pin',
        keyId: 'k3',
        pin: 1,
      },
      end: {
        kind: 'free',
        at: {
          xU: -1,
          yU: 2.3667,
        },
        boardPin: 6,
      },
      bends: [],
    },
    {
      id: 'w7',
      start: {
        kind: 'key-pin',
        keyId: 'k3',
        pin: 2,
      },
      end: {
        kind: 'key-pin',
        keyId: 'k0',
        pin: 2,
      },
      bends: [],
    },
    {
      id: 'w8',
      start: {
        kind: 'key-pin',
        keyId: 'k4',
        pin: 1,
      },
      end: {
        kind: 'key-pin',
        keyId: 'k3',
        pin: 1,
      },
      bends: [],
    },
    {
      id: 'w9',
      start: {
        kind: 'key-pin',
        keyId: 'k4',
        pin: 2,
      },
      end: {
        kind: 'key-pin',
        keyId: 'k1',
        pin: 2,
      },
      bends: [],
    },
    {
      id: 'w10',
      start: {
        kind: 'key-pin',
        keyId: 'k5',
        pin: 1,
      },
      end: {
        kind: 'key-pin',
        keyId: 'k4',
        pin: 1,
      },
      bends: [],
    },
    {
      id: 'w11',
      start: {
        kind: 'key-pin',
        keyId: 'k5',
        pin: 2,
      },
      end: {
        kind: 'key-pin',
        keyId: 'k2',
        pin: 2,
      },
      bends: [],
    },
  ],
  insulatedCrossings: [
    {
      wireIds: ['w2', 'w7'],
      ordinal: 0,
    },
    {
      wireIds: ['w4', 'w9'],
      ordinal: 0,
    },
  ],
} as const satisfies Pick<Project, 'wires' | 'insulatedCrossings'>;
