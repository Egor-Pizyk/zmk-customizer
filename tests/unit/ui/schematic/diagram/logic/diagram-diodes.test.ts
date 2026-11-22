// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { moveKey } from '@domain/keys';
import { projectDiagram } from '@ui/schematic/diagram/logic';
import { getSchematicMarks } from '@ui/schematic/rendering/logic';
import { buildProject, freeEnd, keyPin } from '../../../../../helpers/build-project';
import type { Project } from '@domain';

function cells(project: Project) {
  return projectDiagram({
    project,
    selection: undefined,
    activeKeyId: undefined,
    view: { pxPerU: 48, zoom: 1, panXPx: 0, panYPx: 0 },
    marks: getSchematicMarks([]),
  });
}

it('moves the symbol with its key while keeping the cathode direction explicit', () => {
  const project = buildProject({
    keys: [{ id: 'k1', xU: 0, yU: 0, diode: { pin: 1, cathode: 'away-switch' } }],
  });
  const original = cells(project).flatMap((cell) => Object.values(cell.attributes));
  const moved = cells(moveKey(project, { keyId: 'k1', position: { xU: 2, yU: 0 } })).flatMap(
    (cell) => Object.values(cell.attributes),
  );
  expect(original).toContainEqual(
    expect.objectContaining({ transform: 'translate(0.3 0.3667) rotate(-90)' }),
  );
  expect(moved).toContainEqual(
    expect.objectContaining({ transform: 'translate(2.3 0.3667) rotate(-90)' }),
  );
  expect(original).toContainEqual(
    expect.objectContaining({ transform: 'translate(0.16 0) rotate(0)' }),
  );
});

it.each(['away-switch', 'toward-switch'] as const)(
  'keeps continuous leads and unchanged logical wires for %s polarity',
  (cathode) => {
    const project = buildProject({
      keys: [{ id: 'k1', xU: 0, yU: 0, diode: { pin: 1, cathode } }],
      wires: [{ id: 'w1', start: keyPin('k1', 1), end: freeEnd(-2, 0.3667), bends: [] }],
    });
    const before = JSON.stringify(project);
    const attributes = cells(project).flatMap((cell) => Object.values(cell.attributes));
    expect(attributes).toContainEqual(
      expect.objectContaining({ transform: 'translate(0.3 0.3667) rotate(180)' }),
    );
    expect(attributes).toContainEqual(expect.objectContaining({ d: 'M0 0 H0.105 M0.215 0 H0.32' }));
    expect(attributes).toContainEqual(expect.objectContaining({ d: 'M 0.3 0.3667 L -2 0.3667' }));
    expect(JSON.stringify(project)).toBe(before);
  },
);
