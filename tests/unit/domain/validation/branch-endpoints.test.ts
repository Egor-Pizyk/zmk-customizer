import { expect, it } from 'vitest';
import { validateSchematic } from '@domain/validation';
import { buildProject, freeEnd, keyPin } from '../../../helpers/build-project';

it('recognizes an explicit junction at a spine endpoint without treating every free spine end as connected', () => {
  const project = buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0 }],
    wires: [
      { id: 'w0', start: freeEnd(0, 2, 2), end: freeEnd(3, 2), bends: [] },
      {
        id: 'w1',
        start: keyPin('k0', 1),
        end: { kind: 'junction', wireId: 'w0', at: { xU: 3, yU: 2 } },
        bends: [],
      },
      { id: 'w2', start: freeEnd(4, 2, 3), end: freeEnd(5, 2), bends: [] },
    ],
  });
  expect(
    validateSchematic(project)
      .filter((issue) => issue.code === 'wire-end-unconnected')
      .map((issue) => issue.path),
  ).toEqual([['wires', 2, 'end']]);
});

it('keeps an endpoint unconnected when another wire only passes through it', () => {
  const project = buildProject({
    wires: [
      { id: 'w0', start: freeEnd(0, 2, 2), end: freeEnd(3, 2), bends: [] },
      { id: 'w1', start: freeEnd(3, 1, 3), end: freeEnd(3, 3, 4), bends: [] },
    ],
  });
  expect(
    validateSchematic(project)
      .filter((issue) => issue.code === 'wire-end-unconnected')
      .map((issue) => issue.path),
  ).toEqual([['wires', 0, 'end']]);
});

it('recognizes an explicitly pooled pin lead at a spine endpoint', () => {
  const project = {
    ...buildProject({
      keys: [{ id: 'k0', xU: 0, yU: 0 }],
      wires: [
        {
          id: 'w0',
          start: freeEnd(0, 2, 2),
          end: freeEnd(3, 2),
          bends: [],
          contactIds: [0],
          anchors: { start: { xU: 0, yU: 2 }, end: { xU: 3, yU: 2 } },
        },
      ],
    }),
    wireContacts: [{ keyId: 'k0', pin: 1 as const, at: { xU: 3, yU: 2 } }],
  };
  expect(
    validateSchematic(project).filter((issue) => issue.code === 'wire-end-unconnected'),
  ).toEqual([]);
});

it('does not hide a dangling end merely because the same spine has a junction elsewhere', () => {
  const project = buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0 }],
    wires: [
      { id: 'w0', start: freeEnd(0, 2, 2), end: freeEnd(3, 2), bends: [] },
      {
        id: 'w1',
        start: keyPin('k0', 1),
        end: { kind: 'junction', wireId: 'w0', at: { xU: 1, yU: 2 } },
        bends: [],
      },
    ],
  });
  expect(
    validateSchematic(project)
      .filter((issue) => issue.code === 'wire-end-unconnected')
      .map((issue) => issue.path),
  ).toEqual([['wires', 0, 'end']]);
});
