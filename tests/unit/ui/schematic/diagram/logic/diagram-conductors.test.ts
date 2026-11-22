// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { projectDiagram, resolveDiagramHit } from '@ui/schematic/diagram/logic';
import { addWire } from '@domain/wires/editing';
import { getSchematicMarks } from '@ui/schematic/rendering/logic';
import { buildProject, keyPin } from '../../../../../helpers/build-project';

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

it('projects durable A–B–C sections with independent expected contact coordinates', () => {
  const project = circuit();
  const before = JSON.stringify(project);
  const cells = projectDiagram({
    project,
    selection: undefined,
    activeKeyId: undefined,
    view: { pxPerU: 48, zoom: 1, panXPx: 0, panYPx: 0 },
    marks: getSchematicMarks([]),
  });
  const sections = cells.filter((cell) => cell.reference?.kind === 'section');
  expect(sections.map((cell) => cell.reference)).toEqual([
    { kind: 'section', wireId: 'w1', sectionId: 'w1:0:0' },
    { kind: 'section', wireId: 'w1', sectionId: 'w1:0:1' },
  ]);
  expect(
    sections.flatMap((cell) => Object.values(cell.attributes).map((attributes) => attributes['d'])),
  ).toContain('M 0.3 0.3667 L 2.3 0.3667');
  expect(
    sections.flatMap((cell) => Object.values(cell.attributes).map((attributes) => attributes['d'])),
  ).toContain('M 2.3 0.3667 L 4.3 0.3667');
  expect(JSON.stringify(project)).toBe(before);
});

it('accepts explicit domain hits and rejects missing entities or arbitrary diagram segments', () => {
  const project = circuit();
  expect(resolveDiagramHit(project, { kind: 'pin', keyId: 'k2', pin: 1 })).toEqual({
    kind: 'pin',
    keyId: 'k2',
    pin: 1,
  });
  expect(
    resolveDiagramHit(project, { kind: 'section', wireId: 'w1', sectionId: 'w1:0:1' }),
  ).toEqual({ kind: 'section', wireId: 'w1', sectionId: 'w1:0:1' });
  expect(
    resolveDiagramHit(project, { kind: 'section', wireId: 'w1', sectionId: 'segment-42' }),
  ).toEqual({ kind: 'empty' });
  expect(resolveDiagramHit(project, { kind: 'pin', keyId: 'removed', pin: 1 })).toEqual({
    kind: 'empty',
  });
  expect(resolveDiagramHit(project, { kind: 'wire-end', wireId: 'removed', side: 'end' })).toEqual({
    kind: 'empty',
  });
});

it('retains selective ordinal bridges when one wire pair crosses twice', () => {
  const project = buildProject({
    wires: [
      {
        id: 'w1',
        start: { kind: 'free', at: { xU: 0, yU: 1 } },
        end: { kind: 'free', at: { xU: 4, yU: 1 } },
        bends: [],
      },
      {
        id: 'w2',
        start: { kind: 'free', at: { xU: 1, yU: 0 } },
        end: { kind: 'free', at: { xU: 3, yU: 0 } },
        bends: [
          { xU: 1, yU: 2 },
          { xU: 3, yU: 2 },
        ],
      },
    ],
    insulatedCrossings: [{ wireIds: ['w1', 'w2'], ordinal: 1 }],
  });
  const cells = projectDiagram({
    project,
    selection: undefined,
    activeKeyId: undefined,
    view: { pxPerU: 48, zoom: 1, panXPx: 0, panYPx: 0 },
    marks: getSchematicMarks([]),
  });
  expect(cells.filter((cell) => cell.id.startsWith('crossing:')).map((cell) => cell.id)).toEqual([
    'crossing:w1:w2:1',
  ]);
  expect(
    cells.flatMap((cell) => Object.values(cell.attributes).map((attributes) => attributes['d'])),
  ).toContain('M 3 0.875 A 0.125 0.125 0 0 1 3 1.125');
});

it('projects an overlapping interval once under its electrical section identity', () => {
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
  const cells = projectDiagram({
    project,
    selection: undefined,
    activeKeyId: undefined,
    view: { pxPerU: 48, zoom: 1, panXPx: 0, panYPx: 0 },
    marks: getSchematicMarks([]),
  });
  const shared = cells.filter((cell) =>
    Object.values(cell.attributes).some((attributes) => attributes['d'] === 'M 2 0 L 5 0'),
  );
  expect(shared).toHaveLength(1);
  expect(shared.map((cell) => cell.reference?.kind)).toEqual(['section']);
});
