// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { projectDiagram } from '@ui/schematic/diagram/logic';
import type { SchematicSelection } from '@ui/schematic/interaction';
import { getSchematicMarks } from '@ui/schematic/rendering/logic';
import { buildProject, freeEnd } from '../../../../../helpers/build-project';

const project = buildProject({
  wires: [
    { id: 'w1', start: freeEnd(0, 1), end: freeEnd(4, 1), bends: [] },
    { id: 'w2', start: freeEnd(2, 0), end: freeEnd(2, 2), bends: [] },
  ],
});
function highlighted(selection?: SchematicSelection) {
  return projectDiagram({
    project,
    selection,
    activeKeyId: undefined,
    view: { pxPerU: 12, zoom: 0.25, panXPx: 0, panYPx: 0 },
    marks: getSchematicMarks([]),
  })
    .filter((cell) =>
      Object.values(cell.attributes).some((attributes) => attributes['data-selected'] === 'true'),
    )
    .map((cell) => cell.id);
}

it('distinguishes electrical sections and whole-wire bend highlight at low zoom', () => {
  expect(highlighted({ kind: 'sections', base: project, sectionIds: ['w1:0:0'] })).toEqual([
    'section:w1:0:0',
  ]);
  expect(highlighted({ kind: 'wire', wireId: 'w1' })).toEqual(['section:w1:0:0', 'section:w1:0:1']);
  expect(highlighted({ kind: 'sections', base: { ...project }, sectionIds: ['w1:0:0'] })).toEqual(
    [],
  );
  expect(highlighted()).toEqual([]);
});
