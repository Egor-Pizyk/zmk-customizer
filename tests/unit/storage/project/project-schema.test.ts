import { describe, expect, it } from 'vitest';
import { projectSchema } from '@storage/project';

const BASE_LAYER = { id: 'l0', name: 'Base', bindings: {} };

const BASE = {
  schemaVersion: 13,
  encoders: [],
  combos: [],
  macros: [],
  conditionalLayers: [],
  behaviors: [],
  firmware: {},
  controllerId: 'nice_nano_v2',
  name: 'x',
  keys: [],
  wires: [],
  insulatedCrossings: [],
  layers: [BASE_LAYER],
};

const TWO_KEYS = [
  { id: 'k1', xU: 0, yU: 0 },
  { id: 'k2', xU: 1, yU: 0 },
];

const PIN_WIRE = {
  id: 'w1',
  start: { kind: 'key-pin', keyId: 'k1', pin: 1 },
  end: { kind: 'key-pin', keyId: 'k2', pin: 1 },
  bends: [],
};

function issuePathsOf(data: unknown): readonly string[] {
  const result = projectSchema.safeParse(data);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

function issueDetailsOf(data: unknown): readonly { message: string; path: string }[] {
  const result = projectSchema.safeParse(data);
  return result.success
    ? []
    : result.error.issues.map((issue) => ({ message: issue.message, path: issue.path.join('.') }));
}

describe('projectSchema v2 schematic', () => {
  it('accepts every wire end kind', () => {
    const wires = [
      PIN_WIRE,
      {
        id: 'w2',
        start: { kind: 'key-pin', keyId: 'k1', pin: 2 },
        end: { kind: 'junction', wireId: 'w1', at: { xU: 0.5, yU: 0 } },
        bends: [{ xU: 0.5, yU: 1 }],
      },
      {
        id: 'w3',
        start: { kind: 'key-pin', keyId: 'k2', pin: 2 },
        end: { kind: 'free', at: { xU: 3, yU: 3 }, boardPin: 31 },
        bends: [],
      },
    ];
    const data = {
      ...BASE,
      keys: TWO_KEYS,
      wires,
      insulatedCrossings: [{ wireIds: ['w1', 'w3'], ordinal: 0 }],
    };
    expect(projectSchema.safeParse(data).success).toBe(true);
  });

  it.each([
    ['a key id without the k prefix', { keys: [{ id: 'x1', xU: 0, yU: 0 }] }, 'keys.0.id'],
    ['a duplicate key id', { keys: [TWO_KEYS[0], { ...TWO_KEYS[1], id: 'k1' }] }, 'keys.1.id'],
    [
      'a duplicate wire id',
      { keys: TWO_KEYS, wires: [PIN_WIRE, { ...PIN_WIRE, end: { ...PIN_WIRE.end, pin: 2 } }] },
      'wires.1.id',
    ],
    [
      'a pin that references a missing key',
      { keys: TWO_KEYS, wires: [{ ...PIN_WIRE, end: { ...PIN_WIRE.end, keyId: 'k9' } }] },
      'wires.0.end.keyId',
    ],
    [
      'a pin number other than 1 or 2',
      { keys: TWO_KEYS, wires: [{ ...PIN_WIRE, end: { ...PIN_WIRE.end, pin: 3 } }] },
      'wires.0.end.pin',
    ],
    [
      'a junction onto a missing wire',
      {
        keys: TWO_KEYS,
        wires: [{ ...PIN_WIRE, end: { kind: 'junction', wireId: 'w9', at: { xU: 0, yU: 0 } } }],
      },
      'wires.0.end.wireId',
    ],
    [
      'a junction onto its own wire',
      {
        keys: TWO_KEYS,
        wires: [{ ...PIN_WIRE, end: { kind: 'junction', wireId: 'w1', at: { xU: 0, yU: 0 } } }],
      },
      'wires.0.end.wireId',
    ],
    [
      'a board pin out of range',
      {
        keys: TWO_KEYS,
        wires: [{ ...PIN_WIRE, end: { kind: 'free', at: { xU: 0, yU: 0 }, boardPin: 32 } }],
      },
      'wires.0.end.boardPin',
    ],
    [
      'a wire whose ends are the same pin',
      { keys: TWO_KEYS, wires: [{ ...PIN_WIRE, end: PIN_WIRE.start }] },
      'wires.0.end',
    ],
    [
      'an insulated crossing onto a missing wire',
      {
        keys: TWO_KEYS,
        wires: [PIN_WIRE],
        insulatedCrossings: [{ wireIds: ['w1', 'w9'], ordinal: 0 }],
      },
      'insulatedCrossings.0.wireIds',
    ],
    [
      'unsorted crossing wire ids',
      {
        keys: TWO_KEYS,
        wires: [PIN_WIRE, { ...PIN_WIRE, id: 'w2' }],
        insulatedCrossings: [{ wireIds: ['w2', 'w1'], ordinal: 0 }],
      },
      'insulatedCrossings.0.wireIds',
    ],
    [
      'a negative ordinal',
      {
        keys: TWO_KEYS,
        wires: [PIN_WIRE, { ...PIN_WIRE, id: 'w2' }],
        insulatedCrossings: [{ wireIds: ['w1', 'w2'], ordinal: -1 }],
      },
      'insulatedCrossings.0.ordinal',
    ],
  ])('rejects %s', (_label, change, path) => {
    expect(issuePathsOf({ ...BASE, ...change })).toContain(path);
  });
});

function withBindings(bindings: Record<string, unknown>) {
  return { ...BASE, keys: TWO_KEYS, layers: [{ ...BASE_LAYER, bindings }] };
}

const SPACE = { kind: 'kp', key: { keycode: 'SPACE', modifiers: [] } };

describe('projectSchema v3 bindings', () => {
  it('accepts every binding kind', () => {
    const stroke = { keycode: 'A', modifiers: ['LC', 'LS', 'RG'] };
    const bindings = [
      { kind: 'kp', key: stroke },
      { kind: 'mt', hold: { keycode: 'LSHIFT', modifiers: [] }, tap: stroke },
      { kind: 'sk', key: stroke },
      { kind: 'kt', key: stroke },
      { kind: 'trans' },
      { kind: 'none' },
      { kind: 'caps_word' },
      { kind: 'key_repeat' },
      { kind: 'gresc' },
      { kind: 'bt', command: 'BT_CLR' },
      { kind: 'bt', command: 'BT_SEL', profile: 1 },
      { kind: 'out', command: 'OUT_USB' },
      { kind: 'sys_reset' },
      { kind: 'bootloader' },
      {
        kind: 'tap_dance',
        taps: [
          { keycode: 'A', modifiers: [] },
          { keycode: 'B', modifiers: ['LS'] },
        ],
        tappingTermMs: 250,
      },
      {
        kind: 'mod_morph',
        normal: { keycode: 'ESCAPE', modifiers: [] },
        morphed: { keycode: 'GRAVE', modifiers: [] },
        mods: ['LS', 'RS'],
      },
    ];
    for (const binding of bindings) {
      expect(issuePathsOf(withBindings({ k1: binding }))).toEqual([]);
    }
  });

  it('leaves unknown keycodes and large profiles to validation (research R7)', () => {
    const bindings = {
      k1: { kind: 'kp', key: { keycode: 'BANG', modifiers: [] } },
      k2: { kind: 'bt', command: 'BT_SEL', profile: 7 },
    };
    expect(issuePathsOf(withBindings(bindings))).toEqual([]);
  });

  it.each([
    ['an unknown kind', { k1: { kind: 'foo' } }, 'layers.0.bindings.k1'],
    ['an extra field', { k1: { kind: 'none', key: 'A' } }, 'layers.0.bindings.k1'],
    [
      'a negative profile',
      { k1: { kind: 'bt', command: 'BT_SEL', profile: -1 } },
      'layers.0.bindings.k1',
    ],
    [
      'a fractional profile',
      { k1: { kind: 'bt', command: 'BT_DISC', profile: 1.5 } },
      'layers.0.bindings.k1',
    ],
    ['a main-only output', { k1: { kind: 'out', command: 'OUT_NONE' } }, 'layers.0.bindings.k1'],
    [
      'modifiers out of order',
      { k1: { kind: 'kp', key: { keycode: 'A', modifiers: ['LS', 'LC'] } } },
      'layers.0.bindings.k1',
    ],
    [
      'a duplicate modifier',
      { k1: { kind: 'kp', key: { keycode: 'A', modifiers: ['LC', 'LC'] } } },
      'layers.0.bindings.k1',
    ],
    ['a binding for a missing key', { k9: SPACE }, 'layers.0.bindings.k9'],
  ])('rejects %s', (_label, bindings, path) => {
    // zod reports inside the one union option that matched the kind, else at the binding.
    const paths = issuePathsOf(withBindings(bindings));
    expect(paths.some((issuePath) => issuePath.startsWith(path))).toBe(true);
  });

  it('rejects a project without layers', () => {
    expect(issuePathsOf({ ...BASE, layers: [] })).toContain('layers');
  });

  it('rejects a duplicate layer id', () => {
    expect(issuePathsOf({ ...BASE, layers: [BASE_LAYER, BASE_LAYER] })).toContain('layers.1.id');
  });

  it('names the duplicate layer id in the message (contracts/project-schema.md)', () => {
    expect(issueDetailsOf({ ...BASE, layers: [BASE_LAYER, BASE_LAYER] })).toContainEqual({
      message: 'Duplicate id l0',
      path: 'layers.1.id',
    });
  });

  it('names the missing key in the message for a dangling binding', () => {
    expect(issueDetailsOf(withBindings({ k7: SPACE }))).toContainEqual({
      message: 'No key with id k7',
      path: 'layers.0.bindings.k7',
    });
  });

  it('rejects a layer id without the l prefix', () => {
    expect(issuePathsOf({ ...BASE, layers: [{ ...BASE_LAYER, id: 'x0' }] })).toContain(
      'layers.0.id',
    );
  });
});

it('accepts repairable conductor fragments without a key-pin endpoint', () => {
  expect(
    projectSchema.safeParse({
      ...BASE,
      wires: [
        {
          id: 'w1',
          start: { kind: 'free', at: { xU: 0, yU: 0 } },
          end: { kind: 'free', at: { xU: 1, yU: 0 } },
          bends: [],
        },
      ],
    }).success,
  ).toBe(true);
});
