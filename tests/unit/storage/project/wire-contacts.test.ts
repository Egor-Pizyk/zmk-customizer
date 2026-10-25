import { expect, it } from 'vitest';
import { getProjectResourceError } from '@domain/project';
import { parseProjectFile, serializeProject } from '@storage/project';
import { buildProject, keyPin } from '../../../helpers/build-project';
import { getResultValue, getResultError } from '../../../helpers/result';

const base = buildProject({
  keys: [
    { id: 'k1', xU: 0, yU: 0 },
    { id: 'k2', xU: 2, yU: 0 },
  ],
});

it('refuses an imported contact detached from the conductor', () => {
  const result = parseProjectFile(
    JSON.stringify({
      ...base,
      wires: [
        {
          id: 'w1',
          start: keyPin('k1', 1),
          end: keyPin('k2', 1),
          bends: [],
          anchors: { start: { xU: 0.3, yU: 0.3667 }, end: { xU: 2.3, yU: 0.3667 } },
          contacts: [{ keyId: 'k1', pin: 2, at: { xU: 20, yU: 20 } }],
        },
      ],
    }),
  );
  expect(getResultError(result).kind).toBe('not-project');
  expect(JSON.stringify(getResultError(result))).toContain('"path":"wires.0.contacts"');
});

it('refuses duplicate, missing-key and endpoint contacts', () => {
  for (const contacts of [
    [{ keyId: 'missing', pin: 1, at: { xU: 1, yU: 0.3667 } }],
    [{ keyId: 'k1', pin: 1, at: { xU: 0.3, yU: 0.3667 } }],
    [
      { keyId: 'k1', pin: 2, at: { xU: 1, yU: 0.3667 } },
      { keyId: 'k1', pin: 2, at: { xU: 1, yU: 0.3667 } },
    ],
  ]) {
    expect(
      parseProjectFile(
        JSON.stringify({
          ...base,
          wires: [{ id: 'w1', start: keyPin('k1', 1), end: keyPin('k2', 1), bends: [], contacts }],
        }),
      ).ok,
    ).toBe(false);
  }
});

it('migrates a legacy project at the wire limit without splitting its wires', () => {
  const wires = Array.from({ length: 600 }, (_, index) => ({
    id: `w${index}`,
    start: keyPin('k1', 1),
    end: keyPin('k2', 1),
    bends: [],
  }));
  const project = getResultValue(
    parseProjectFile(JSON.stringify({ ...base, schemaVersion: 11, wires })),
  );
  expect(project.wires).toHaveLength(600);
  expect(project.schemaVersion).toBe(13);
});

it('keeps a formerly valid near-byte-budget legacy circuit importable after adding anchors', () => {
  const keys = Array.from({ length: 512 }, (_, index) => ({ id: `k${index}`, xU: index, yU: 0 }));
  const wires = Array.from({ length: 600 }, (_, index) => ({
    id: `w${index}`,
    start: keyPin('k0', 1),
    end: keyPin('k511', 1),
    bends: [],
  }));
  const layers = Array.from({ length: 64 }, (_, index) => ({
    id: `l${index}`,
    name: 'Layer',
    bindings: Object.fromEntries(
      keys.map((key) => [key.id, { kind: 'kp', key: { keycode: 'A'.repeat(15), modifiers: [] } }]),
    ),
  }));
  const legacy = `${JSON.stringify({ ...base, schemaVersion: 11, keys, wires, layers }, null, 2)}\n`;
  expect(new TextEncoder().encode(legacy).length).toBeLessThanOrEqual(5 * 1024 * 1024);
  const project = getResultValue(parseProjectFile(legacy));
  expect(project.layers).toEqual(layers);
  expect(project.wires).toHaveLength(600);
  expect(project.wireContacts).toHaveLength(510);
  expect(project.wires[599]?.contactIds).toHaveLength(510);
  const saved = getResultValue(serializeProject(project));
  expect(saved.split('\n')).toHaveLength(2);
  expect(new TextEncoder().encode(saved).length).toBeLessThanOrEqual(5 * 1024 * 1024);
  expect(getProjectResourceError(project)).toBeUndefined();
  expect(getResultValue(parseProjectFile(saved))).toEqual(project);
}, 60_000);

it.each([
  { wireContacts: [], contactIds: [0] },
  { wireContacts: [false], contactIds: [0] },
  { wireContacts: [{ keyId: 'k1', pin: 1, at: { xU: 0.3, yU: 0.3667 } }], contactIds: [0] },
  { wireContacts: [{ keyId: 'missing', pin: 1, at: { xU: 0.3, yU: 0.3667 } }], contactIds: [] },
])('refuses malformed shared contact provenance %#', ({ wireContacts, contactIds }) => {
  expect(
    parseProjectFile(
      JSON.stringify({
        ...base,
        wireContacts,
        wires: [
          {
            id: 'w1',
            start: keyPin('k1', 1),
            end: keyPin('k2', 1),
            bends: [],
            anchors: { start: { xU: 0.3, yU: 0.3667 }, end: { xU: 2.3, yU: 0.3667 } },
            contactIds,
          },
        ],
      }),
    ).ok,
  ).toBe(false);
});
