import { setWireBends } from '@domain/wires/editing';
import { expect, it } from 'vitest';

import { buildProject, freeEnd, keyPin } from '../../../../helpers/build-project';

it('replaces the bends of one wire', () => {
  const wire = { id: 'w1', start: keyPin('k1', 1), end: freeEnd(3, 3), bends: [] };
  const project = setWireBends(
    buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }], wires: [wire] }),
    { wireId: 'w1', bends: [{ xU: 1, yU: 1 }] },
  );
  expect(project.wires[0]?.bends).toEqual([{ xU: 1, yU: 1 }]);
});

it('preserves identity for unknown wires and equal bend values', () => {
  const project = buildProject({
    wires: [{ id: 'w1', start: keyPin('k1', 1), end: freeEnd(3, 3), bends: [{ xU: 1, yU: 1 }] }],
  });
  expect(setWireBends(project, { wireId: 'missing', bends: [] })).toBe(project);
  expect(setWireBends(project, { wireId: 'w1', bends: [{ xU: 1, yU: 1 }] })).toBe(project);
});

it('refuses an oversized bend edit and permits repairing an oversized wire', () => {
  const wire = { id: 'w1', start: keyPin('k1', 1), end: freeEnd(3, 3), bends: [] };
  const before = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }], wires: [wire] });
  const bends = Array.from({ length: 65 }, () => ({ xU: 1, yU: 1 }));
  expect(setWireBends(before, { wireId: 'w1', bends })).toBe(before);
  const repaired = setWireBends(
    { ...before, wires: [{ ...wire, bends }] },
    { wireId: 'w1', bends: [] },
  );
  expect(repaired.wires[0]?.bends).toEqual([]);
});

it('refuses bends that would leave a retained intermediate contact off its fixed spine', () => {
  const project = buildProject({
    keys: [
      { id: 'k1', xU: 0, yU: 0 },
      { id: 'k2', xU: 2, yU: 0 },
      { id: 'k3', xU: 4, yU: 0 },
    ],
    wires: [
      {
        id: 'w1',
        start: keyPin('k1', 1),
        end: keyPin('k3', 1),
        bends: [],
        anchors: { start: { xU: 0.3, yU: 0.3667 }, end: { xU: 4.3, yU: 0.3667 } },
        contacts: [{ keyId: 'k2', pin: 1, at: { xU: 2.3, yU: 0.3667 } }],
      },
    ],
  });
  expect(
    setWireBends(project, {
      wireId: 'w1',
      bends: [
        { xU: 0.3, yU: 2 },
        { xU: 4.3, yU: 2 },
      ],
    }),
  ).toBe(project);
});
