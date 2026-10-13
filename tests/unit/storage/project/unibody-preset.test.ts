import { getResultValue } from '../../../helpers/result';
import { expect, it } from 'vitest';
import { BINDINGS_CATALOG } from '@catalog/bindings';
import { SHIELD_TARGET } from '@catalog/firmware';
import { getControllerFixtures } from '../../../helpers/controller-fixtures';
import { serializeProject, parseProjectFile } from '@storage/project';
import { buildUnibodyProject } from '../../../helpers/build-unibody-project';
import { createPresetProject, validateShieldProject } from '@domain';

const { project: UNIBODY_PRESET, getBoard: getControllerBoard } = getControllerFixtures();

it('provides independent schemaVersion 5 projects matching the approved complete example', () => {
  const project = createPresetProject(UNIBODY_PRESET);
  expect(project).toEqual(buildUnibodyProject());
  expect(project).not.toBe(UNIBODY_PRESET);
  expect(project.keys).not.toBe(UNIBODY_PRESET.keys);
  expect(
    validateShieldProject(project, {
      board: getControllerBoard(project.controllerId),
      bindingsCatalog: BINDINGS_CATALOG,
      target: SHIELD_TARGET,
    }),
  ).toEqual([]);
  expect(project.keys.every((key) => key.diode !== undefined)).toBe(true);
  expect(project.layers).toHaveLength(2);
  const saved = serializeProject(project);
  const parsed = parseProjectFile(getResultValue(saved));
  expect(parsed).toEqual({ ok: true, value: project });
});
