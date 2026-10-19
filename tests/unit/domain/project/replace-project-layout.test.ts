import { getResultValue } from '../../../helpers/result';
import { expect, it } from 'vitest';
import { replaceProjectLayout } from '@domain/project';
import { getKeyGeometry } from '@domain/geometry';
import { UNIBODY_PRESET } from '@catalog/presets';
import { parseProjectFile, serializeProject } from '@storage/project';

it('replaces layout immutably with deterministic IDs and resets unrelated content', () => {
  const before = structuredClone(UNIBODY_PRESET);
  const geometry = getKeyGeometry({ id: 'input', xU: -2, yU: 3, widthU: 1.5, rotationDeg: 15 });
  const project = replaceProjectLayout(UNIBODY_PRESET, [geometry]);
  expect(UNIBODY_PRESET).toEqual(before);
  expect(project).toEqual({
    schemaVersion: 11,
    encoders: [],
    name: before.name,
    controllerId: before.controllerId,
    keys: [{ id: 'k0', ...geometry }],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
    firmware: {},
    behaviors: [],
    combos: [],
    macros: [],
    conditionalLayers: [],
  });
  expect(replaceProjectLayout(UNIBODY_PRESET, [geometry])).toEqual(project);
  const serialized = serializeProject(project);
  expect(serialized.ok).toBe(true);
  expect(parseProjectFile(getResultValue(serialized))).toEqual({ ok: true, value: project });
});

it('retains original identity for an empty or over-budget layout', () => {
  expect(replaceProjectLayout(UNIBODY_PRESET, [])).toBe(UNIBODY_PRESET);
  const geometry = getKeyGeometry({ id: 'a', xU: 0, yU: 0 });
  expect(
    replaceProjectLayout(
      UNIBODY_PRESET,
      Array.from({ length: 513 }, () => geometry),
    ),
  ).toBe(UNIBODY_PRESET);
});
