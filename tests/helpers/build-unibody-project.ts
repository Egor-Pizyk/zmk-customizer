import type { Project, Key, Wire } from '@domain';
import { findCrossings } from '@domain/crossings';
import { getKeyPinPosition } from '@domain/wires';

import { buildProject } from './build-project';

const LAYERS: Project['layers'] = [
  {
    id: 'l0',
    name: 'Base',
    bindings: {
      k0: { kind: 'kp', key: { keycode: 'A', modifiers: [] } },
      k1: { kind: 'kp', key: { keycode: 'B', modifiers: [] } },
      k2: { kind: 'mo', layerId: 'l1' },
      k3: {
        kind: 'tap_dance',
        taps: [
          { keycode: 'C', modifiers: [] },
          { keycode: 'D', modifiers: [] },
        ],
        tappingTermMs: 200,
      },
      k4: {
        kind: 'mod_morph',
        normal: { keycode: 'BACKSPACE', modifiers: [] },
        morphed: { keycode: 'DELETE', modifiers: [] },
        mods: ['LS', 'RS'],
      },
      k5: { kind: 'lt', layerId: 'l1', tap: { keycode: 'SPACE', modifiers: [] } },
    },
  },
  {
    id: 'l1',
    name: 'Fn',
    bindings: {
      k0: { kind: 'kp', key: { keycode: 'N1', modifiers: [] } },
      k1: { kind: 'kp', key: { keycode: 'N2', modifiers: [] } },
      k2: { kind: 'trans' },
      k3: { kind: 'bt', command: 'BT_CLR' },
      k4: { kind: 'out', command: 'OUT_USB' },
      k5: { kind: 'to', layerId: 'l0' },
    },
  },
];

export function buildUnibodyProject(): Project {
  const keys: Key[] = Array.from({ length: 6 }, (_, keyIndex) => ({
    id: `k${keyIndex}`,
    xU: (keyIndex % 3) * 2,
    yU: Math.floor(keyIndex / 3) * 2,
    diode: { pin: 1, cathode: 'away-switch' },
  }));
  const wires = keys.flatMap((key, keyIndex) => buildKeyWires(key, keyIndex));
  const raw = buildProject({ keys, wires });
  const project = {
    ...raw,
    insulatedCrossings: findCrossings(raw).map((crossing) => crossing.ref),
  };
  return {
    ...project,
    name: 'Unibody six',
    shieldName: 'unibody_six',
    layers: LAYERS,
  };
}

function buildKeyWires(key: Key, keyIndex: number): Wire[] {
  const row = Math.floor(keyIndex / 3);
  const col = keyIndex % 3;
  const pin1 = getKeyPinPosition(key, 1);
  const pin2 = getKeyPinPosition(key, 2);
  return [
    {
      id: `w${keyIndex * 2}`,
      start: { kind: 'key-pin', keyId: key.id, pin: 1 },
      end:
        col === 0
          ? { kind: 'free', at: { xU: -1, yU: pin1.yU }, boardPin: row === 0 ? 2 : 6 }
          : { kind: 'key-pin', keyId: `k${keyIndex - 1}`, pin: 1 },
      bends: [],
    },
    {
      id: `w${keyIndex * 2 + 1}`,
      start: { kind: 'key-pin', keyId: key.id, pin: 2 },
      end:
        row === 0
          ? { kind: 'free', at: { xU: pin2.xU, yU: -1 }, boardPin: [8, 9, 10][col] ?? 8 }
          : { kind: 'key-pin', keyId: `k${col}`, pin: 2 },
      bends: [],
    },
  ];
}
