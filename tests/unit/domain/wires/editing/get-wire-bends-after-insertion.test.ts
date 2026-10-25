import { getWireBendsAfterInsertion, setWireBends } from '@domain/wires/editing';
import { expect, it } from 'vitest';
import { getDefinedValue } from '../../../../helpers/defined-value';
import { buildProject, freeEnd, keyPin } from '../../../../helpers/build-project';

const project = buildProject({
  wires: [
    {
      id: 'w1',
      start: freeEnd(0, 0),
      end: freeEnd(4, 0),
      bends: [
        { xU: 1, yU: 1 },
        { xU: 3, yU: 1 },
      ],
    },
  ],
});

it('inserts a bend at the position clicked along the wire path', () => {
  expect(getWireBendsAfterInsertion(project, { wireId: 'w1', point: { xU: 2, yU: 1 } })).toEqual([
    { xU: 1, yU: 1 },
    { xU: 2, yU: 1 },
    { xU: 3, yU: 1 },
  ]);
});

it('does not duplicate an existing bend', () => {
  expect(getWireBendsAfterInsertion(project, { wireId: 'w1', point: { xU: 1, yU: 1 } })).toBe(
    project.wires[0]?.bends,
  );
});

it('projects a near-line click onto the conductor without breaking an intermediate pin contact', () => {
  const wired = buildProject({
    keys: [
      { id: 'k0', xU: 5, yU: 5 },
      { id: 'k1', xU: 7, yU: 5 },
    ],
    wires: [
      {
        id: 'w1',
        start: keyPin('k0', 1),
        end: freeEnd(9, 7, 4),
        bends: [],
        anchors: { start: { xU: 5.3, yU: 5.3667 }, end: { xU: 9, yU: 7 } },
        contacts: [{ keyId: 'k1', pin: 1, at: { xU: 7.3, yU: 5.3667 } }],
      },
    ],
  });
  const bends = getDefinedValue(
    getWireBendsAfterInsertion(wired, { wireId: 'w1', point: { xU: 6.3, yU: 5.35 } }),
  );
  expect(bends).toEqual([{ xU: 6.3, yU: 5.3667 }]);
  const edited = setWireBends(wired, { wireId: 'w1', bends });
  expect(edited).not.toBe(wired);
  expect(edited.wires[0]?.contacts).toEqual(wired.wires[0]?.contacts);
  expect(edited.wires[0]?.bends).toEqual(bends);
  expect(edited.wires[0]?.end).toEqual(wired.wires[0]?.end);
});

it('projects onto a vertical segment and does not duplicate a nearby saved corner', () => {
  expect(
    getWireBendsAfterInsertion(project, { wireId: 'w1', point: { xU: 1.01, yU: 0.5 } }),
  ).toEqual([
    { xU: 1, yU: 0.5 },
    { xU: 1, yU: 1 },
    { xU: 3, yU: 1 },
  ]);
  expect(getWireBendsAfterInsertion(project, { wireId: 'w1', point: { xU: 0.99, yU: 1.01 } })).toBe(
    project.wires[0]?.bends,
  );
});
