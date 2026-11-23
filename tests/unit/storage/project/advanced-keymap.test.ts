import { expect, it } from 'vitest';
import { parseProjectFile, serializeProject } from '@storage/project';
import { getResultValue } from '../../../helpers/result';
import fixture from '../../../fixtures/project/v9-advanced-legacy.json?raw';
import { UNIBODY_PRESET } from '../../../helpers/unibody-preset';

it('migrates unchanged v9 data and retains all previous content', () => {
  const result = getResultValue(parseProjectFile(fixture));
  expect(result).toMatchObject({
    schemaVersion: 14,
    encoders: [],
    behaviors: [],
    combos: [],
    macros: [],
    conditionalLayers: [],
    firmware: { CONFIG_ZMK_SLEEP: true },
    layers: [{ id: 'l0', bindings: { k0: { kind: 'kp', key: { keycode: 'A', modifiers: [] } } } }],
  });
});
it('round trips stable advanced identities and repairable dangling references', () => {
  const project = {
    ...UNIBODY_PRESET,
    combos: [
      {
        id: 'c1',
        name: 'Escape',
        keyIds: ['k0', 'k99'],
        binding: { kind: 'macro' as const, macroId: 'm1' },
        timeoutMs: 50,
        layerIds: [],
      },
    ],
    macros: [
      {
        id: 'm1',
        name: 'Type',
        waitMs: 15,
        tapMs: 30,
        steps: [
          {
            id: 's1',
            kind: 'tap' as const,
            binding: { kind: 'kp' as const, key: { keycode: 'A', modifiers: [] } },
          },
          { id: 's2', kind: 'wait' as const, durationMs: 100 },
        ],
      },
    ],
    conditionalLayers: [{ id: 'q1', ifLayerIds: ['l1', 'l99'], thenLayerId: 'l2' }],
  };
  expect(parseProjectFile(getResultValue(serializeProject(project)))).toEqual({
    ok: true,
    value: project,
  });
});
it.each([null, {}, [{ id: 'c1' }], Array.from({ length: 129 }, () => ({}))])(
  'rejects malformed/excessive combos %j',
  (combos) => {
    expect(parseProjectFile(JSON.stringify({ ...UNIBODY_PRESET, combos })).ok).toBe(false);
  },
);
