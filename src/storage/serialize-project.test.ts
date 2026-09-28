import { expect, it } from 'vitest';
import fixtureSmall from '../../tests/fixtures/schematic/small.json?raw';
import { projectSchema } from './project-schema';
import { serializeProject } from './serialize-project';

it('writes 2-space JSON in schema key order with one trailing newline', () => {
  const text = serializeProject({
    shieldName: 'corne',
    name: 'x',
    schemaVersion: 2,
    keys: [],
    wires: [],
    insulatedCrossings: [],
  });
  expect(text).toBe(
    '{\n  "schemaVersion": 2,\n  "name": "x",\n  "shieldName": "corne",\n  "keys": [],\n  "wires": [],\n  "insulatedCrossings": []\n}\n',
  );
});

it('omits shieldName when absent', () => {
  expect(
    serializeProject({ schemaVersion: 2, keys: [], wires: [], insulatedCrossings: [], name: 'x' }),
  ).not.toContain('shieldName');
});

it('reproduces the v2 schematic fixture bytes', () => {
  const project = projectSchema.parse(JSON.parse(fixtureSmall));
  expect(serializeProject(project)).toBe(fixtureSmall);
});
