import type { WirePoint } from '@domain';
import { expect, it } from 'vitest';
import { addWire } from '@domain/wires/editing';
import { getKeyPinWires } from '@domain/wires';
import { getWireConductors, getKeyPinPosition } from '@domain/wires/geometry';
import { moveKeys, setKeyGeometries } from '@domain/keys';
import { buildProject, keyPin } from '../../../helpers/build-project';
import { getDefinedValue } from '../../../helpers/defined-value';

function circuit(middleYU = 0) {
  return addWire(
    buildProject({
      keys: [
        { id: 'k1', xU: 0, yU: 0 },
        { id: 'k2', xU: 2, yU: middleYU },
        { id: 'k3', xU: 4, yU: 0 },
      ],
    }),
    { start: keyPin('k1', 1), end: keyPin('k3', 1), bends: [] },
  );
}

it('keeps an encountered pin attached when any connected key moves', () => {
  const project = circuit();
  for (const keyId of ['k1', 'k2', 'k3']) {
    const after = moveKeys(project, { moves: [{ keyId, position: { xU: 8, yU: 3 } }] });
    expect(getKeyPinWires(after)({ keyId: 'k2', pin: 1 })).toEqual([0]);
  }
});

it('does not attach an unrelated pin moved across an existing conductor', () => {
  const before = circuit(3);
  const after = moveKeys(before, { moves: [{ keyId: 'k2', position: { xU: 2, yU: 0 } }] });
  expect(getKeyPinWires(after)({ keyId: 'k2', pin: 1 })).toEqual([]);
});

it('keeps the intermediate fixed point on the drawn conductor after moving endpoints', () => {
  const project = circuit();
  const anchor = getKeyPinPosition(getDefinedValue(project.keys.find((key) => key.id === 'k2')), 1);
  for (const keyId of ['k1', 'k3']) {
    const after = moveKeys(project, { moves: [{ keyId, position: { xU: 8, yU: 3 } }] });
    const wire = getDefinedValue(after.wires[0]);
    const onSpine = containsPoint(getDefinedValue(getWireConductors(after, wire)[0]), anchor);
    expect(onSpine).toBe(true);
  }
});

function containsPoint(path: readonly WirePoint[], anchor: WirePoint): boolean {
  return path.some((from, index) => {
    const to = path[index + 1] ?? from;
    return (
      anchor.xU >= Math.min(from.xU, to.xU) &&
      anchor.xU <= Math.max(from.xU, to.xU) &&
      anchor.yU >= Math.min(from.yU, to.yU) &&
      anchor.yU <= Math.max(from.yU, to.yU)
    );
  });
}

it('refuses a key move that would merge formerly separate overlapping conductors', () => {
  const project = buildProject({
    keys: [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 0, yU: 2 },
    ],
    wires: [
      {
        id: 'w1',
        start: keyPin('k1', 1),
        end: { kind: 'free', at: { xU: 4, yU: 0.3667 } },
        bends: [],
      },
      {
        id: 'w2',
        start: keyPin('k2', 1),
        end: { kind: 'free', at: { xU: 4, yU: 2.3667 } },
        bends: [],
      },
    ],
  });
  expect(moveKeys(project, { moves: [{ keyId: 'k2', position: { xU: 1, yU: 0 } }] })).toBe(project);
});

it.each([0, 0.00005, 0.0002])(
  'captures intermediate pin contacts only within tolerance at offset %s',
  (offset) => {
    const project = circuit(offset);
    expect(getKeyPinWires(project)({ keyId: 'k2', pin: 1 }).length).toBe(
      expectedContactCount(offset),
    );
  },
);

it('preserves diode-pin attachments and fixed anchors across rotation and resize', () => {
  const base = circuit();
  const project = { ...base, keys: base.keys.map(withMiddleDiode) };
  const next = setKeyGeometries(project, {
    changes: [{ keyId: 'k2', geometry: { rotationDeg: 45, widthU: 2, heightU: 1.5 } }],
  });
  expect(getKeyPinWires(next)({ keyId: 'k2', pin: 1 })).toEqual([0]);
  expect(next.wires[0]?.anchors).toEqual(project.wires[0]?.anchors);
  expect(next.keys[1]?.diode).toEqual({ pin: 1, cathode: 'away-switch' });
});

function withMiddleDiode(key: ReturnType<typeof buildProject>['keys'][number]) {
  return key.id === 'k2'
    ? { ...key, diode: { pin: 1 as const, cathode: 'away-switch' as const } }
    : key;
}

function expectedContactCount(offset: number) {
  return Number(offset <= 0.0001);
}
