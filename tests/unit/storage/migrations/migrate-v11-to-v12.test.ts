import { removeWire, removeWireSections } from '@domain/wires/editing';
import { expect, it } from 'vitest';
import { parseProjectFile, serializeProject } from '@storage/project';
import { getKeyPinWires } from '@domain/wires';
import { moveKeys, removeKey } from '@domain/keys';
import legacy from '../../../fixtures/project/v11-wiring-contacts.json?raw';
import { getResultValue } from '../../../helpers/result';

it('captures legacy contacts and retains them after movement and file round trip', () => {
  const project = getResultValue(parseProjectFile(legacy));
  expect(project.schemaVersion).toBe(13);
  const moved = moveKeys(project, { moves: [{ keyId: 'k1', position: { xU: 7, yU: 3 } }] });
  expect(getKeyPinWires(moved)({ keyId: 'k2', pin: 1 })).toEqual([0]);
  const again = getResultValue(parseProjectFile(getResultValue(serializeProject(moved))));
  expect(again).toEqual(moved);
});

it('retains every branch attachment when a redundant legacy conductor is later deleted', () => {
  const original = {
    ...getResultValue(parseProjectFile(legacy)),
    schemaVersion: 11,
    wireContacts: undefined,
    wires: [
      {
        id: 'w1',
        start: { kind: 'key-pin', keyId: 'k1', pin: 1 },
        end: { kind: 'key-pin', keyId: 'k3', pin: 1 },
        bends: [],
      },
    ],
  };
  const project = getResultValue(
    parseProjectFile(
      JSON.stringify({
        ...original,
        wires: [...original.wires, { ...original.wires[0], id: 'w2' }],
      }),
    ),
  );
  const remaining = removeWire(project, { wireId: 'w1' });
  expect(getKeyPinWires(remaining)({ keyId: 'k2', pin: 1 })).toEqual([0]);
});

it('materializes maximal surviving shared spans without exhausting the wire budget', () => {
  const base = getResultValue(parseProjectFile(legacy));
  const keys = Array.from({ length: 32 }, (_, index) => ({ id: `k${index}`, xU: index, yU: 0 }));
  const wires = Array.from({ length: 30 }, (_, index) => ({
    id: `w${index}`,
    start: { kind: 'key-pin', keyId: 'k0', pin: 1 },
    end: { kind: 'key-pin', keyId: 'k31', pin: 1 },
    bends: [],
  }));
  const project = getResultValue(
    parseProjectFile(
      JSON.stringify({
        ...base,
        schemaVersion: 11,
        wireContacts: undefined,
        keys,
        wires,
        layers: [{ id: 'l0', name: 'Base', bindings: {} }],
      }),
    ),
  );
  const next = getResultValue(
    removeWireSections(project, { base: project, sectionIds: ['w0:0:0'] }),
  );
  expect(next.wires).toHaveLength(30);
  expect(getKeyPinWires(next)({ keyId: 'k1', pin: 1 })).toHaveLength(30);
});

it('tombstones deleted pooled pins without changing other wire references', () => {
  const project = getResultValue(parseProjectFile(legacy));
  const next = removeKey(project, { keyId: 'k2' });
  expect(next.wireContacts).toEqual([false]);
  expect(next.wires[0]?.contactIds).toEqual([]);
  expect(getResultValue(parseProjectFile(getResultValue(serializeProject(next))))).toEqual(next);
});
