import { expect, it } from 'vitest';
import { getWireSections } from '@domain/wires';
import { removeWireSections, addWire } from '@domain/wires/editing';
import { moveKeys } from '@domain/keys';
import { getNets } from '@domain/wires/nets';
import { getWireConductors } from '@domain/wires/geometry';
import { buildProject, freeEnd, keyPin } from '../../../../helpers/build-project';
import { getResultValue, getResultError } from '../../../../helpers/result';
import { getDefinedValue } from '../../../../helpers/defined-value';

function branched() {
  return buildProject({
    wires: [
      { id: 'w1', start: freeEnd(0, 0, 4), end: freeEnd(6, 0), bends: [] },
      {
        id: 'w2',
        start: { kind: 'junction', wireId: 'w1', at: { xU: 2, yU: 0 } },
        end: freeEnd(2, 2),
        bends: [],
      },
      {
        id: 'w3',
        start: { kind: 'junction', wireId: 'w1', at: { xU: 4, yU: 0 } },
        end: freeEnd(4, 2),
        bends: [],
      },
    ],
  });
}

it('keeps GPIO and unselected branches after a middle cut and tolerates repeated refs', () => {
  const project = branched();
  const next = getResultValue(
    removeWireSections(project, { base: project, sectionIds: ['w1:0:1', 'w1:0:1'] }),
  );
  expect(next.wires).toHaveLength(4);
  expect(next.wires[0]?.start).toEqual(freeEnd(0, 0, 4));
  expect(next.wires.find((wire) => wire.id === 'w3')?.start).toMatchObject({
    kind: 'junction',
    wireId: 'w4',
  });
  expect(getNets(next).map((net) => net.wireIds)).toEqual([
    ['w1', 'w2'],
    ['w4', 'w3'],
  ]);
});

it('frees a branch endpoint only when its target section disappears', () => {
  const project = branched();
  const next = getResultValue(
    removeWireSections(project, { base: project, sectionIds: ['w1:0:0', 'w1:0:1', 'w1:0:2'] }),
  );
  expect(next.wires.map((wire) => wire.start)).toEqual([freeEnd(2, 0), freeEnd(4, 0)]);
});

it('returns the base for no selection and refuses nonexistent refs', () => {
  const project = branched();
  expect(getResultValue(removeWireSections(project, { base: project, sectionIds: [] }))).toBe(
    project,
  );
  expect(
    getResultError(removeWireSections(project, { base: project, sectionIds: ['stale'] })),
  ).toContain('changed');
});

it('keeps a moved contact lead and its fixed bus when another section is cut', () => {
  const wired = addWire(
    buildProject({
      keys: [
        { id: 'k1', xU: 0, yU: 0 },
        { id: 'k2', xU: 2, yU: 0 },
        { id: 'k3', xU: 4, yU: 0 },
      ],
    }),
    { start: keyPin('k1', 1), end: keyPin('k3', 1), bends: [] },
  );
  const moved = moveKeys(wired, { moves: [{ keyId: 'k2', position: { xU: 2, yU: 2 } }] });
  const next = getResultValue(removeWireSections(moved, { base: moved, sectionIds: ['w1:0:0'] }));
  expect(pinsOfSecondKey(next)).toEqual([
    { keyId: 'k2', pin: 1 },
    { keyId: 'k3', pin: 1 },
  ]);
  expect(next.wires.flatMap((wire) => getWireConductors(next, wire)).flat()).toContainEqual({
    xU: 2.3,
    yU: 0.3667,
  });
});

it('splits connected crossings while keeping insulated crossings inside their section', () => {
  const project = buildProject({
    wires: [
      { id: 'w1', start: freeEnd(0, 0), end: freeEnd(6, 0), bends: [] },
      { id: 'w2', start: freeEnd(2, -1), end: freeEnd(2, 1), bends: [] },
      { id: 'w3', start: freeEnd(4, -1), end: freeEnd(4, 1), bends: [] },
    ],
    insulatedCrossings: [{ wireIds: ['w1', 'w3'], ordinal: 0 }],
  });
  expect(getWireSections(project).filter((section) => section.wireId === 'w1')).toHaveLength(2);
  const next = getResultValue(
    removeWireSections(project, { base: project, sectionIds: ['w1:0:0'] }),
  );
  expect(next.insulatedCrossings).toEqual([{ wireIds: ['w1', 'w3'], ordinal: 0 }]);
  expect(getDefinedValue(next.wires.find((wire) => wire.id === 'w3'))).toEqual(project.wires[2]);
});

it('preserves different pins sharing the same intermediate anchor', () => {
  const project = addWire(
    buildProject({
      keys: [
        { id: 'k1', xU: 0, yU: 0 },
        { id: 'k2', xU: 2, yU: 0 },
        { id: 'k3', xU: 4, yU: 0 },
        { id: 'k4', xU: 2, yU: 0 },
      ],
    }),
    { start: keyPin('k1', 1), end: keyPin('k3', 1), bends: [] },
  );
  const next = getResultValue(
    removeWireSections(project, { base: project, sectionIds: ['w1:0:0'] }),
  );
  expect(pinsOfSecondKey(next)).toEqual([
    { keyId: 'k2', pin: 1 },
    { keyId: 'k3', pin: 1 },
    { keyId: 'k4', pin: 1 },
  ]);
});

function pinsOfSecondKey(project: ReturnType<typeof buildProject>) {
  return getNets(project).find((net) => net.pins.some((pin) => pin.keyId === 'k2' && pin.pin === 1))
    ?.pins;
}

it('refuses an atomic cut when surviving fragments exceed the wire budget', () => {
  const source = branched();
  const fillers = Array.from({ length: 597 }, (_, index) => ({
    id: `w${index + 4}`,
    start: freeEnd(20, index + 10),
    end: freeEnd(21, index + 10),
    bends: [],
  }));
  const project = { ...source, wires: [...source.wires, ...fillers] };
  expect(
    getResultError(removeWireSections(project, { base: project, sectionIds: ['w1:0:1'] })),
  ).toContain('600 wires');
  expect(project.wires).toHaveLength(600);
});

it('retains controller-half provenance on fragments with no remaining pin', () => {
  const source = branched();
  const project = {
    ...source,
    wiring: {
      kind: 'matrix' as const,
      topology: 'split' as const,
      diodeDirection: 'col2row' as const,
      terminals: [],
    },
    wires: source.wires.map(withRightHalf),
  };
  const next = getResultValue(
    removeWireSections(project, { base: project, sectionIds: ['w1:0:1'] }),
  );
  expect(next.wires.map((wire) => wire.half)).toEqual(['right', 'right', 'right', 'right']);
});

function withRightHalf(wire: ReturnType<typeof buildProject>['wires'][number]) {
  return { ...wire, half: 'right' as const };
}
