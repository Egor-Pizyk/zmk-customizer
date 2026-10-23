import { getNets } from '@domain/wires/nets';
import { expect, it } from 'vitest';
import { getWireSections, getKeyPinWires } from '@domain/wires';
import { addWire, removeWireSections } from '@domain/wires/editing';
import { buildProject, keyPin } from '../../../helpers/build-project';
import { getResultValue } from '../../../helpers/result';
import { getDefinedValue } from '../../../helpers/defined-value';

function circuit() {
  return addWire(
    buildProject({
      keys: [
        { id: 'k1', xU: 0, yU: 0 },
        { id: 'k2', xU: 2, yU: 0 },
        { id: 'k3', xU: 4, yU: 0 },
      ],
    }),
    { start: keyPin('k1', 1), end: keyPin('k3', 1), bends: [] },
  );
}

it('splits a row at its intermediate pin but not at ordinary bends', () => {
  const sections = getWireSections(circuit());
  expect(sections).toHaveLength(2);
  expect(sections.map((section) => [section.path[0], section.path.at(-1)])).toEqual([
    [
      { xU: 0.3, yU: 0.3667 },
      { xU: 2.3, yU: 0.3667 },
    ],
    [
      { xU: 2.3, yU: 0.3667 },
      { xU: 4.3, yU: 0.3667 },
    ],
  ]);
});

it('deletes one section while keeping keys and the other connected branch', () => {
  const project = circuit();
  const first = getDefinedValue(getWireSections(project)[0]);
  const after = getResultValue(
    removeWireSections(project, { base: project, sectionIds: [first.id] }),
  );
  expect(after.keys).toEqual(project.keys);
  expect(getKeyPinWires(after)({ keyId: 'k1', pin: 1 })).toEqual([]);
  expect(getKeyPinWires(after)({ keyId: 'k2', pin: 1 })).toHaveLength(1);
  expect(getKeyPinWires(after)({ keyId: 'k3', pin: 1 })).toHaveLength(1);
});

it('refuses section refs from a different immutable project base', () => {
  const project = buildProject({});
  expect(
    removeWireSections({ ...project, name: 'changed' }, { base: project, sectionIds: [] }).ok,
  ).toBe(false);
});

it('groups an overlapped conductor and removes all contributors', () => {
  const keys = [
    { id: 'k1', xU: 0, yU: 0 },
    { id: 'k2', xU: 2, yU: 0 },
  ];
  const project = buildProject({
    keys,
    wires: [
      { id: 'w1', start: keyPin('k1', 1), end: keyPin('k2', 1), bends: [] },
      { id: 'w2', start: keyPin('k2', 1), end: keyPin('k1', 1), bends: [] },
    ],
  });
  const sections = getWireSections(project);
  expect(sections).toHaveLength(1);
  const section = getDefinedValue(sections[0]);
  expect(section.contributors).toHaveLength(2);
  expect(
    getResultValue(removeWireSections(project, { base: project, sectionIds: [section.id] })).wires,
  ).toEqual([]);
});

it('finds the shared interval bounded by internal bends of both wires', () => {
  const project = buildProject({
    wires: [
      {
        id: 'w1',
        start: { kind: 'free', at: { xU: 0, yU: 0 } },
        end: { kind: 'free', at: { xU: 5, yU: 2 } },
        bends: [{ xU: 5, yU: 0 }],
      },
      {
        id: 'w2',
        start: { kind: 'free', at: { xU: 2, yU: -2 } },
        end: { kind: 'free', at: { xU: 7, yU: 0 } },
        bends: [{ xU: 2, yU: 0 }],
      },
    ],
  });
  const shared = getWireSections(project).filter((section) => section.contributors.length === 2);
  expect(shared.map((section) => section.path)).toEqual([
    [
      { xU: 2, yU: 0 },
      { xU: 5, yU: 0 },
    ],
  ]);
  const result = getResultValue(
    removeWireSections(project, { base: project, sectionIds: shared.map((section) => section.id) }),
  );
  expect(getWireSections(result).some((section) => section.contributors.length === 2)).toBe(false);
});

it('treats identical bent spans with different collinear bend counts as one conductor', () => {
  const project = buildProject({
    wires: [
      {
        id: 'w1',
        start: { kind: 'free', at: { xU: 0, yU: 0 } },
        end: { kind: 'free', at: { xU: 2, yU: 2 } },
        bends: [{ xU: 2, yU: 0 }],
      },
      {
        id: 'w2',
        start: { kind: 'free', at: { xU: 0, yU: 0 } },
        end: { kind: 'free', at: { xU: 2, yU: 2 } },
        bends: [
          { xU: 1, yU: 0 },
          { xU: 2, yU: 0 },
        ],
      },
    ],
  });
  expect(getWireSections(project)).toHaveLength(1);
  expect(
    getResultValue(removeWireSections(project, { base: project, sectionIds: ['w1:0:0'] })).wires,
  ).toEqual([]);
});

it.each([
  {
    crossing: { xU: 2, yU: 0 },
    start: { xU: 2, yU: -2 },
    end: { xU: 2, yU: 2 },
    expected: [
      [
        { xU: 0, yU: 0 },
        { xU: 2, yU: 0 },
      ],
      [
        { xU: 2, yU: 0 },
        { xU: 4, yU: 0 },
        { xU: 4, yU: 4 },
      ],
    ],
  },
  {
    crossing: { xU: 4, yU: 2 },
    start: { xU: 2, yU: 2 },
    end: { xU: 6, yU: 2 },
    expected: [
      [
        { xU: 0, yU: 0 },
        { xU: 4, yU: 0 },
        { xU: 4, yU: 2 },
      ],
      [
        { xU: 4, yU: 2 },
        { xU: 4, yU: 4 },
      ],
    ],
  },
])(
  'splits both sides of an L at $crossing but keeps an insulated bridge continuous',
  ({ start, end, expected }) => {
    const project = buildProject({
      wires: [
        {
          id: 'w1',
          start: { kind: 'free', at: { xU: 0, yU: 0 } },
          end: { kind: 'free', at: { xU: 4, yU: 4 } },
          bends: [],
        },
        { id: 'w2', start: { kind: 'free', at: start }, end: { kind: 'free', at: end }, bends: [] },
      ],
    });
    expect(
      getWireSections(project)
        .filter((section) => section.wireId === 'w1')
        .map((section) => section.path),
    ).toEqual(expected);
    expect(getNets(project).map((net) => net.wireIds)).toEqual([['w1', 'w2']]);
    const insulated = {
      ...project,
      insulatedCrossings: [{ wireIds: ['w1', 'w2'] as const, ordinal: 0 }],
    };
    expect(
      getWireSections(insulated)
        .filter((section) => section.wireId === 'w1')
        .map((section) => section.path),
    ).toEqual([
      [
        { xU: 0, yU: 0 },
        { xU: 4, yU: 0 },
        { xU: 4, yU: 4 },
      ],
    ]);
    expect(getNets(insulated).map((net) => net.wireIds)).toEqual([['w1'], ['w2']]);
  },
);
