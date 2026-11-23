// @vitest-environment jsdom
import { getDefinedValue } from '../../../../../helpers/defined-value';
import { expect, it } from 'vitest';
import { projectDiagram } from '@ui/schematic/diagram/logic';
import { getSchematicMarks } from '@ui/schematic/rendering/logic';
import { buildProject, freeEnd } from '../../../../../helpers/build-project';

it('projects rotated key art and domain section paths without changing accepted data', () => {
  const project = buildProject({
    keys: [{ id: 'k1', xU: 2, yU: 3, rotationDeg: 90 }],
    wires: [{ id: 'w1', start: freeEnd(0, 0), end: freeEnd(3, 2), bends: [{ xU: 3, yU: 0 }] }],
  });
  const before = JSON.stringify(project);
  const cells = projectDiagram({
    project,
    selection: undefined,
    activeKeyId: 'k1',
    view: { pxPerU: 48, zoom: 1, panXPx: 0, panYPx: 0 },
    marks: getSchematicMarks([]),
  });
  const key = getDefinedValue(cells.find((cell) => cell.id === 'key:k1'));
  expect(Object.values(key.attributes)).toContainEqual(
    expect.objectContaining({ transform: 'rotate(90 0 0)', 'data-key-id': 'k1' }),
  );
  expect(Object.values(key.attributes)).toContainEqual(
    expect.objectContaining({ x: 2.04, y: 3.04, width: 0.92, height: 0.92 }),
  );
  const section = getDefinedValue(cells.find((cell) => cell.id === 'section:w1:0:0'));
  expect(section.reference).toEqual({ kind: 'section', wireId: 'w1', sectionId: 'w1:0:0' });
  expect(Object.values(section.attributes)).toContainEqual(
    expect.objectContaining({ d: 'M 0 0 L 3 0 L 3 2' }),
  );
  expect(new Set(cells.map((cell) => cell.id)).size).toBe(cells.length);
  expect(JSON.stringify(project)).toBe(before);
});

it('keeps disconnected surviving wires and incomplete geometry inspectable', () => {
  const project = buildProject({
    wires: [{ id: 'w1', start: freeEnd(0, 0), end: freeEnd(2, 0), bends: [] }],
  });
  const cells = projectDiagram({
    project,
    selection: undefined,
    activeKeyId: undefined,
    view: { pxPerU: 24, zoom: 0.5, panXPx: 20, panYPx: 20 },
    marks: getSchematicMarks([]),
  });
  expect(cells.map((cell) => cell.id)).toEqual(['section:w1:0:0', 'end:w1:start', 'end:w1:end']);
});

it('keeps diode terminals display-only and encoder push art owned by its encoder', () => {
  const project = {
    ...buildProject({
      keys: [
        { id: 'same', xU: 0, yU: 0, diode: { pin: 1 as const, cathode: 'away-switch' as const } },
        { id: 'push', xU: 4, yU: 0 },
      ],
    }),
    encoders: [
      {
        id: 'same',
        xU: 4,
        yU: 0,
        half: 'left' as const,
        steps: 20,
        triggersPerRotation: 80,
        wiringMode: 'schematic' as const,
        pushKeyId: 'push',
      },
    ],
  };
  const before = JSON.stringify(project);
  const cells = projectDiagram({
    project,
    selection: undefined,
    activeKeyId: 'same',
    view: { pxPerU: 48, zoom: 1, panXPx: 0, panYPx: 0 },
    marks: getSchematicMarks([]),
  });
  expect(cells.map((cell) => cell.id)).toContain('key:same');
  expect(cells.map((cell) => cell.id)).toContain('encoder:same');
  expect(cells.map((cell) => cell.id)).not.toContain('key:push');
  const pins = getDefinedValue(cells.find((cell) => cell.id === 'pins:same'));
  expect(Object.values(pins.attributes)).toContainEqual(
    expect.objectContaining({ transform: 'translate(0.3 0.3667) rotate(-90)' }),
  );
  const encoder = getDefinedValue(cells.find((cell) => cell.id === 'encoder:same'));
  expect(Object.values(encoder.attributes)).toContainEqual(
    expect.objectContaining({ 'data-key-id': 'push', 'data-pin': 1 }),
  );
  expect(Object.values(encoder.attributes)).toContainEqual(
    expect.objectContaining({ 'data-encoder-id': 'same', 'data-encoder-pin': 'COM' }),
  );
  expect(JSON.stringify(project)).toBe(before);
});

it('renders only saved crossing bridges and preserves electrical section boundaries', () => {
  const base = buildProject({
    wires: [
      { id: 'w1', start: freeEnd(0, 1), end: freeEnd(2, 1), bends: [] },
      { id: 'w2', start: freeEnd(1, 0), end: freeEnd(1, 2), bends: [] },
    ],
  });
  const project = { ...base, insulatedCrossings: [{ wireIds: ['w1', 'w2'] as const, ordinal: 0 }] };
  const input = {
    selection: undefined,
    activeKeyId: undefined,
    view: { pxPerU: 48, zoom: 1, panXPx: 0, panYPx: 0 },
    marks: getSchematicMarks([]),
  };
  const connected = projectDiagram({ ...input, project: base });
  expect(connected.filter((cell) => cell.reference?.kind === 'section')).toHaveLength(4);
  expect(connected.some((cell) => cell.id.startsWith('crossing:'))).toBe(false);
  const insulated = projectDiagram({ ...input, project });
  expect(insulated.filter((cell) => cell.reference?.kind === 'section')).toHaveLength(2);
  const bridge = getDefinedValue(insulated.find((cell) => cell.id === 'crossing:w1:w2:0'));
  expect(Object.values(bridge.attributes)).toContainEqual(
    expect.objectContaining({ d: 'M 1 0.875 A 0.125 0.125 0 0 1 1 1.125' }),
  );
});
