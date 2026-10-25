import { addKey, moveKey, moveKeys } from '@domain/keys';
import { addWire } from '@domain/wires/editing';
import { createProject } from '@domain/project';
import type { Project } from '@domain';
import { projectSchema, serializeProject } from '@storage/project';
import { describe, expect, it } from 'vitest';
import fixtureSmall from '../../../fixtures/schematic/small.json?raw';

function expectSerializedText(project: Project): string {
  const serialized = serializeProject(project);
  if (!serialized.ok) {
    throw new Error(`serialize failed: ${serialized.error}`);
  }
  return serialized.value;
}

it('writes 2-space JSON in schema key order with one trailing newline', () => {
  const text = expectSerializedText({
    shieldName: 'corne',
    name: 'x',
    schemaVersion: 13,
    encoders: [],
    combos: [],
    macros: [],
    conditionalLayers: [],
    behaviors: [],
    firmware: {},
    controllerId: 'nice_nano_v2',
    keys: [],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  });
  expect(text).toBe(
    '{\n  "schemaVersion": 13,\n  "encoders": [],\n  "combos": [],\n  "macros": [],\n  "conditionalLayers": [],\n  "behaviors": [],\n  "firmware": {},\n  "controllerId": "nice_nano_v2",\n  "name": "x",\n  "shieldName": "corne",\n  "keys": [],\n  "wires": [],\n  "insulatedCrossings": [],\n  "layers": [\n    {\n      "id": "l0",\n      "name": "Base",\n      "bindings": {}\n    }\n  ]\n}\n',
  );
});

it('omits shieldName when absent', () => {
  expect(
    expectSerializedText({
      schemaVersion: 13,
      encoders: [],
      combos: [],
      macros: [],
      conditionalLayers: [],
      behaviors: [],
      firmware: {},
      controllerId: 'nice_nano_v2',
      keys: [],
      wires: [],
      insulatedCrossings: [],
      layers: [{ id: 'l0', name: 'Base', bindings: {} }],
      name: 'x',
    }),
  ).not.toContain('shieldName');
});

it('writes migrated v3 bytes with explicit controller and unmappable pin metadata', () => {
  const expected = fixtureSmall
    .replace(
      '"schemaVersion": 3,',
      '"schemaVersion": 13,\n  "encoders": [],\n  "combos": [],\n  "macros": [],\n  "conditionalLayers": [],\n  "behaviors": [],\n  "firmware": {},\n  "controllerId": "nice_nano_v2",',
    )
    .replace('"boardPin": 3', '"droppedBoardPin": "nice!nano v2 P3"');
  const project = projectSchema.parse(JSON.parse(expected));
  expect(expectSerializedText(project)).toBe(expected);
});

it('reports a schema failure instead of throwing', () => {
  const bad: Project = {
    schemaVersion: 13,
    encoders: [],
    combos: [],
    macros: [],
    conditionalLayers: [],
    behaviors: [],
    firmware: {},
    controllerId: 'nice_nano_v2',
    name: 'x',
    keys: [{ id: 'bad', xU: 0, yU: 0 }],
    wires: [],
    insulatedCrossings: [],
    layers: [{ id: 'l0', name: 'Base', bindings: {} }],
  };
  const serialized = serializeProject(bad);
  expect(serialized.ok).toBe(false);
});

describe('every domain operation result passes the schema', () => {
  it('round-trips create/add/move/wire through serialize + parse', () => {
    const empty = createProject({ controllerId: 'nice_nano_v2' });
    const withKey = addKey(empty, { position: { xU: 0, yU: 0 } });
    const withTwo = addKey(withKey, { position: { xU: 2, yU: 0 } });
    const moved = moveKey(withTwo, { keyId: 'k1', position: { xU: 0, yU: 1 } });
    const movedGroup = moveKeys(moved, {
      moves: moved.keys.map((key) => ({ keyId: key.id, position: { xU: key.xU, yU: key.yU } })),
    });
    const wired = addWire(movedGroup, {
      start: { kind: 'key-pin', keyId: 'k1', pin: 1 },
      end: { kind: 'key-pin', keyId: 'k2', pin: 1 },
      bends: [],
    });
    for (const project of [empty, withKey, withTwo, moved, movedGroup, wired]) {
      expect(projectSchema.safeParse(project).success).toBe(true);
      expect(serializeProject(project).ok).toBe(true);
    }
  });
});
