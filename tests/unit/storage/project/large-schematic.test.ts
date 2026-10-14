import { BINDINGS_CATALOG } from '@catalog/bindings';
import { findCrossings } from '@domain/crossings';
import { validateProject } from '@domain/validation';
import { migrateProject } from '@storage/migrations';
import { parseProjectFile, projectSchema } from '@storage/project';
import { expect, it } from 'vitest';
import fixtureLarge from '../../../fixtures/schematic/large.json?raw';

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
