import { describe, expect, it } from 'vitest';
import { reduceWireDraft } from './reduce-wire-draft';
import type { DraftTarget, WireDraft } from './reduce-wire-draft';
import { buildProject } from '../../../tests/helpers/build-project';

const PROJECT = buildProject({
  keys: [
    { id: 'k1', xU: 0, yU: 0 },
    { id: 'k2', xU: 2, yU: 0 },
  ],
  wires: [
    {
      id: 'w1',
      start: { kind: 'key-pin', keyId: 'k2', pin: 2 },
      end: { kind: 'free', at: { xU: 3, yU: 3 } },
      bends: [],
    },
  ],
});

const PIN_A: DraftTarget = { kind: 'key-pin', keyId: 'k1', pin: 1, point: { xU: 0.3, yU: 0.3667 } };
const PIN_B: DraftTarget = { kind: 'key-pin', keyId: 'k2', pin: 1, point: { xU: 2.3, yU: 0.3667 } };

function empty(xU: number, yU: number): DraftTarget {
  return { kind: 'empty', point: { xU, yU } };
}

function clickAll(targets: readonly (readonly [DraftTarget, number])[]) {
  let draft: WireDraft | undefined;
  let result = reduceWireDraft(draft, { kind: 'cancel' });
  for (const [target, timeMs] of targets) {
    result = reduceWireDraft(draft, { kind: 'click', target, timeMs, project: PROJECT });
    draft = result.draft;
  }
  return result;
}

describe('reduceWireDraft', () => {
  it('draws pin → bend → pin', () => {
    const result = clickAll([
      [PIN_A, 0],
      [empty(1, 2), 1000],
      [PIN_B, 2000],
    ]);
    expect(result.draft).toBeUndefined();
    expect(result.finished).toEqual({
      start: { kind: 'key-pin', keyId: 'k1', pin: 1 },
      end: { kind: 'key-pin', keyId: 'k2', pin: 1 },
      bends: [{ xU: 1, yU: 2 }],
    });
  });

  it('starts on an empty spot and ends on a pin', () => {
    const result = clickAll([
      [empty(4, 4), 0],
      [PIN_A, 1000],
    ]);
    expect(result.finished?.start).toEqual({ kind: 'free', at: { xU: 4, yU: 4 } });
  });

  it('ends with a free end on a double-click', () => {
    const result = clickAll([
      [PIN_A, 0],
      [empty(3, 3), 1000],
      [empty(3.05, 3), 1200],
    ]);
    expect(result.finished).toEqual({
      start: { kind: 'key-pin', keyId: 'k1', pin: 1 },
      end: { kind: 'free', at: { xU: 3, yU: 3 } },
      bends: [],
    });
  });

  it('joins onto a wire with a junction', () => {
    const result = clickAll([
      [PIN_A, 0],
      [{ kind: 'wire', wireId: 'w1', point: { xU: 1, yU: 1 } }, 1000],
    ]);
    expect(result.finished?.end).toEqual({ kind: 'junction', wireId: 'w1', at: { xU: 1, yU: 1 } });
  });

  it('refuses a wire without a key pin and says why', () => {
    const result = clickAll([
      [empty(0, 0), 0],
      [empty(5, 5), 1000],
      [empty(5, 5), 1100],
    ]);
    expect(result.finished).toBeUndefined();
    expect(result.draft).toBeUndefined();
    expect(result.hint).toBe('A wire must start or end on a key pin.');
  });

  it('names the reason when the wire cannot be added', () => {
    expect(
      clickAll([
        [PIN_A, 0],
        [PIN_A, 1000],
      ]).hint,
    ).toBe('A wire cannot run from a pin to the same pin.');
    const gone: DraftTarget = { kind: 'key-pin', keyId: 'k9', pin: 1, point: { xU: 9, yU: 9 } };
    expect(
      clickAll([
        [gone, 0],
        [PIN_B, 1000],
      ]).finished,
    ).toBeUndefined();
  });

  it('cancels', () => {
    const started = clickAll([[PIN_A, 0]]);
    expect(reduceWireDraft(started.draft, { kind: 'cancel' }).draft).toBeUndefined();
  });
});

it('keeps a junction attachment on the electrical wire while its preview uses display coordinates', () => {
  const result = clickAll([
    [PIN_A, 0],
    [
      {
        kind: 'wire',
        wireId: 'w1',
        point: { xU: 2.9533, yU: 0.2333 },
        attachmentPoint: { xU: 2.8, yU: 0.2333 },
      },
      1000,
    ],
  ]);
  expect(result.finished?.end).toEqual({
    kind: 'junction',
    wireId: 'w1',
    at: { xU: 2.8, yU: 0.2333 },
  });
});
