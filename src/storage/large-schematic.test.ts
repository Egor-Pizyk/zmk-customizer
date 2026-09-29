import { expect, it } from 'vitest';
import fixtureLarge from '../../tests/fixtures/schematic/large.json?raw';
import { BINDINGS_CATALOG } from '../catalog/bindings-catalog';
import { findCrossings } from '../domain/find-crossings';
import { validateProject } from '../domain/validate-project';
import { migrateProject } from './migrate-project';
import { parseProjectFile } from './parse-project-file';
import { projectSchema } from './project-schema';

// SC-005 fixture (100 keys, 300 wires); browser profiling uses the same file (quickstart 7).
it('loads the large schematic and derives crossings and problems', () => {
  expect(parseProjectFile(fixtureLarge).ok).toBe(true);
  const data: unknown = JSON.parse(fixtureLarge);
  const project = projectSchema.parse(migrateProject(data, { fromVersion: 2 }));
  expect(project.keys).toHaveLength(100);
  expect(project.wires).toHaveLength(300);
  expect(findCrossings(project).length).toBeGreaterThan(0);
  expect(validateProject(project, BINDINGS_CATALOG).length).toBeGreaterThan(0);
});
