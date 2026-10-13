import type { Project } from '../domain/types';
import { UNIBODY_WIRING } from './unibody-preset-wiring';

// Complete 2×3 macropad; source/differences: tests/fixtures/generated/unibody/DIFFERENCES.md.
const DIODE = { pin: 1, cathode: 'away-switch' } as const;

export const UNIBODY_PRESET = {
  schemaVersion: 6,
  controllerId: 'nice_nano_v2',
  name: 'Unibody six',
  keys: [
    {
      id: 'k0',
      xU: 0,
      yU: 0,
      diode: DIODE,
    },
    {
      id: 'k1',
      xU: 2,
      yU: 0,
      diode: DIODE,
    },
    {
      id: 'k2',
      xU: 4,
      yU: 0,
      diode: DIODE,
    },
    {
      id: 'k3',
      xU: 0,
      yU: 2,
      diode: DIODE,
    },
    {
      id: 'k4',
      xU: 2,
      yU: 2,
      diode: DIODE,
    },
    {
      id: 'k5',
      xU: 4,
      yU: 2,
      diode: DIODE,
    },
  ],
  ...UNIBODY_WIRING,
  layers: [
    {
      id: 'l0',
      name: 'Base',
      bindings: {
        k0: {
          kind: 'kp',
          key: {
            keycode: 'A',
            modifiers: [],
          },
        },
        k1: {
          kind: 'kp',
          key: {
            keycode: 'B',
            modifiers: [],
          },
        },
        k2: {
          kind: 'mo',
          layerId: 'l1',
        },
        k3: {
          kind: 'tap_dance',
          taps: [
            {
              keycode: 'C',
              modifiers: [],
            },
            {
              keycode: 'D',
              modifiers: [],
            },
          ],
          tappingTermMs: 200,
        },
        k4: {
          kind: 'mod_morph',
          normal: {
            keycode: 'BACKSPACE',
            modifiers: [],
          },
          morphed: {
            keycode: 'DELETE',
            modifiers: [],
          },
          mods: ['LS', 'RS'],
        },
        k5: {
          kind: 'lt',
          layerId: 'l1',
          tap: {
            keycode: 'SPACE',
            modifiers: [],
          },
        },
      },
    },
    {
      id: 'l1',
      name: 'Fn',
      bindings: {
        k0: {
          kind: 'kp',
          key: {
            keycode: 'N1',
            modifiers: [],
          },
        },
        k1: {
          kind: 'kp',
          key: {
            keycode: 'N2',
            modifiers: [],
          },
        },
        k2: {
          kind: 'trans',
        },
        k3: {
          kind: 'bt',
          command: 'BT_CLR',
        },
        k4: {
          kind: 'out',
          command: 'OUT_USB',
        },
        k5: {
          kind: 'to',
          layerId: 'l0',
        },
      },
    },
  ],
  shieldName: 'unibody_six',
} as const satisfies Project;
