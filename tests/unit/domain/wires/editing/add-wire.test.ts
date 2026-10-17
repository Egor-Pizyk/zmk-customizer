import { addWire } from '@domain/wires/editing';
import { expect, it } from 'vitest';

import { buildProject, freeEnd, keyPin } from '../../../../helpers/build-project';

it('appends a wire with the next id', () => {
  const project = addWire(buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] }), {
    start: keyPin('k1', 1),
    end: freeEnd(3, 3),
    bends: [{ xU: 3, yU: 0.25 }],
  });
  expect(project.wires).toEqual([
    { id: 'w1', start: keyPin('k1', 1), end: freeEnd(3, 3), bends: [{ xU: 3, yU: 0.25 }] },
  ]);
});

it('refuses a wire with no key pin end', () => {
  const before = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
  const after = addWire(before, {
    start: freeEnd(0, 0),
    end: freeEnd(3, 3),
    bends: [],
  });
  expect(after).toBe(before);
});

it('refuses a wire whose ends are the same pin', () => {
  const before = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
  const after = addWire(before, {
    start: keyPin('k1', 1),
    end: keyPin('k1', 1),
    bends: [],
  });
  expect(after).toBe(before);
});

it('refuses a wire beyond the saved bend budget without changing the project', () => {
  const before = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
  expect(
    addWire(before, {
      start: keyPin('k1', 1),
      end: freeEnd(3, 3),
      bends: Array.from({ length: 65 }, () => ({ xU: 1, yU: 1 })),
    }),
  ).toBe(before);
});

it.each([
  { count: 600, bends: 0 },
  { count: 23, bends: 64 },
])('refuses adding beyond existing wire/segment resources: $count × $bends', ({ count, bends }) => {
  const before = buildProject({
    keys: [{ id: 'k1', xU: 0, yU: 0 }],
    wires: Array.from({ length: count }, (_, index) => ({
      id: `w${index}`,
      start: keyPin('k1', 1),
      end: freeEnd(3, 3),
      bends: Array.from({ length: bends }, () => ({ xU: 1, yU: 1 })),
    })),
  });
  expect(
    addWire(before, {
      start: keyPin('k1', 1),
      end: freeEnd(4, 4),
      bends: Array.from({ length: bends }, () => ({ xU: 1, yU: 1 })),
    }),
  ).toBe(before);
});
