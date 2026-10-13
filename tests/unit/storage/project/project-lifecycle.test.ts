import { expect, it } from 'vitest';
import { getControllerFixtures } from '../../../helpers/controller-fixtures';
import { getResultValue } from '../../../helpers/result';
import { addKey, addLayer, removeKey, setBindings } from '@domain';
import { parseProjectFile, serializeProject } from '@storage/project';
import type { Project } from '@domain';

function roundTrip(project: Project): Project {
  return getResultValue(parseProjectFile(getResultValue(serializeProject(project))));
}

function freezeProject(project: Project): Project {
  freeze(project);
  return project;
}

it.each([1, 2, 6, 12, 32])(
  'preserves key identity across an edit sequence with %i added keys and JSON round trips',
  (count) => {
    const { project: preset } = getControllerFixtures();
    let project = roundTrip(preset);
    function apply(update: (current: Project) => Project) {
      project = roundTrip(update(freezeProject(project)));
      const ids = project.keys.map((key) => key.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const layer of project.layers) {
        expect(Object.keys(layer.bindings).every((id) => ids.includes(id))).toBe(true);
      }
    }
    for (let index = 0; index < count; index += 1) {
      apply((current) => addKey(current, { position: { xU: index * 2 + 30, yU: 20 } }));
    }
    apply(addLayer);
    const selectedIds = project.keys.filter((_, index) => index % 2 === 0).map((key) => key.id);
    apply((current) =>
      setBindings(current, {
        layerIndex: 0,
        keyIds: selectedIds,
        binding: { kind: 'kp', key: { keycode: 'SPACE', modifiers: ['LC'] } },
      }),
    );
    for (const id of selectedIds) {
      apply((current) => removeKey(current, { keyId: id }));
    }
    for (const layer of project.layers) {
      expect(selectedIds.some((id) => id in layer.bindings)).toBe(false);
    }
  },
);

function freeze(value: unknown) {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) {
      freeze(child);
    }
    Object.freeze(value);
  }
}
