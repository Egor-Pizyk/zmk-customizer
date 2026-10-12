import { expect, it } from 'vitest';
import { buildProject, freeEnd, keyPin } from '../../tests/helpers/build-project';
import { getResultValue } from '../../tests/helpers/result';
import { addKey } from '../domain/add-key';
import { addWire } from '../domain/add-wire';
import { addLayer } from '../domain/add-layer';
import { parseProjectFile } from './parse-project-file';
import { serializeProject } from './serialize-project';

it('edits and round trips imported large entity ids and dangling layer references', () => {
  const original = buildProject({
    keys: [{ id: 'k9007199254740992', xU: 0, yU: 0 }],
    wires: [
      {
        id: 'w9007199254740992',
        start: keyPin('k9007199254740992', 1),
        end: freeEnd(1, 0),
        bends: [],
      },
    ],
    layers: [
      {
        id: 'l9007199254740992',
        name: 'Base',
        bindings: { k9007199254740992: { kind: 'mo', layerId: 'l999999999999999999999999999999' } },
      },
    ],
  });
  const imported = getResultValue(parseProjectFile(JSON.stringify(original)));
  const keyed = addKey(imported, { position: { xU: 2, yU: 0 } });
  const wired = addWire(keyed, {
    start: keyPin('k9007199254740993', 1),
    end: freeEnd(3, 0),
    bends: [],
  });
  const layered = addLayer(wired, { reservedLayerIds: ['l1000000000000000000000000000000'] });
  expect(layered.keys.map((key) => key.id)).toEqual(['k9007199254740992', 'k9007199254740993']);
  expect(layered.wires.map((wire) => wire.id)).toEqual(['w9007199254740992', 'w9007199254740993']);
  expect(layered.layers[1]?.id).toBe('l1000000000000000000000000000001');
  expect(getResultValue(parseProjectFile(getResultValue(serializeProject(layered))))).toEqual(
    layered,
  );
  expect(layered.layers[0]).toEqual(original.layers[0]);
});
