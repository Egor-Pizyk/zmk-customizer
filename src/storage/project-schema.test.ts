import { describe, expect, it } from 'vitest';
import { projectSchema } from './project-schema';

const BASE = { schemaVersion: 2, name: 'x', keys: [], wires: [], insulatedCrossings: [] };

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
      'a wire with no key pin end',
      {
        keys: TWO_KEYS,
        wires: [
          {
            ...PIN_WIRE,
            start: { kind: 'free', at: { xU: 0, yU: 0 } },
            end: { kind: 'free', at: { xU: 1, yU: 0 } },
          },
        ],
      },
      'wires.0',
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
