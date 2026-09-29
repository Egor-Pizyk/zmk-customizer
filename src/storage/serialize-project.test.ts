import { expect, it } from 'vitest';
import fixtureSmall from '../../tests/fixtures/schematic/small.json?raw';
import { projectSchema } from './project-schema';
import { serializeProject } from './serialize-project';

it('writes 2-space JSON in schema key order with one trailing newline', () => {
  const text = serializeProject({
    shieldName: 'corne',
    name: 'x',
    schemaVersion: 3,
    keys: [],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  });
  expect(text).toBe(
    '{\n  "schemaVersion": 3,\n  "name": "x",\n  "shieldName": "corne",\n  "keys": [],\n  "wires": [],\n  "insulatedCrossings": [],\n  "layers": [\n    {\n      "id": "l0",\n      "name": "Base",\n      "bindings": {}\n    }\n  ]\n}\n',
  );
});

it('omits shieldName when absent', () => {
  expect(
    serializeProject({
      schemaVersion: 3,
      keys: [],
      wires: [],
      insulatedCrossings: [],
      layers: [{ id: 'l0', name: 'Base', bindings: {} }],
      name: 'x',
    }),
  ).not.toContain('shieldName');
});

it('reproduces the v3 schematic fixture bytes', () => {
  const project = projectSchema.parse(JSON.parse(fixtureSmall));
  expect(serializeProject(project)).toBe(fixtureSmall);
});
