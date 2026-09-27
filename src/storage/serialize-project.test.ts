import { expect, it } from 'vitest';
import fixtureV1 from '../../tests/fixtures/project/v1.json?raw';
import { projectSchema } from './project-schema';
import { serializeProject } from './serialize-project';

it('writes 2-space JSON in schema key order with one trailing newline', () => {
  const text = serializeProject({ shieldName: 'corne', name: 'x', schemaVersion: 1 });
  expect(text).toBe('{\n  "schemaVersion": 1,\n  "name": "x",\n  "shieldName": "corne"\n}\n');
});

it('omits shieldName when absent', () => {
  expect(serializeProject({ schemaVersion: 1, name: 'x' })).not.toContain('shieldName');
});

it('reproduces the v1 fixture bytes', () => {
  const project = projectSchema.parse(JSON.parse(fixtureV1));
  expect(serializeProject(project)).toBe(fixtureV1);
});
