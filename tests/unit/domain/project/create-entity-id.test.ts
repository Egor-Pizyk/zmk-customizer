import { addKey } from '@domain/keys';
import { addWire } from '@domain/wires/editing';
import { addLayer } from '@domain/layers';
import { createProject, createEntityId } from '@domain/project';
import { parseProjectFile, serializeProject } from '@storage/project';
import { getResultValue } from '../../../helpers/result';
import { expect, it } from 'vitest';

it('starts at 1 when nothing exists', () => {
  expect(createEntityId({ prefix: 'k', existingIds: [] })).toBe('k1');
});

it('takes the highest existing number plus one, ignoring order and gaps', () => {
  expect(createEntityId({ prefix: 'w', existingIds: ['w2', 'w10', 'w3'] })).toBe('w11');
});

it('ignores ids with another prefix', () => {
  expect(createEntityId({ prefix: 'k', existingIds: ['w7', 'k2'] })).toBe('k3');
});

it('creates layer ids (spec 007)', () => {
  expect(createEntityId({ prefix: 'l', existingIds: ['l0', 'l3'] })).toBe('l4');
});

it.each(['k', 'w', 'l'] as const)(
  'allocates %s ids beyond Number precision without exponent notation',
  (prefix) => {
    expect(createEntityId({ prefix, existingIds: [`${prefix}9007199254740992`] })).toBe(
      `${prefix}9007199254740993`,
    );
    expect(
      createEntityId({ prefix, existingIds: [`${prefix}999999999999999999999999999999`] }),
    ).toBe(`${prefix}1000000000000000000000000000000`);
    expect(createEntityId({ prefix, existingIds: [`${prefix}0009`, `${prefix}10`] })).toBe(
      `${prefix}11`,
    );
  },
);

it('ignores non-decimal suffixes', () => {
  expect(createEntityId({ prefix: 'k', existingIds: ['k1e3', 'k', 'k-2', 'k2.5', 'k3'] })).toBe(
    'k4',
  );
});

it.each(['k', 'w', 'l', 't'] as const)(
  'keeps %s allocation within the persisted ID limit',
  (prefix) => {
    const existingIds = [`${prefix}${'9'.repeat(127)}`, `${prefix}1`, `${prefix}2`];
    const id = createEntityId({ prefix, existingIds });
    expect(id.length).toBeLessThanOrEqual(128);
    expect(existingIds).not.toContain(id);
    expect(createEntityId({ prefix, existingIds: [...existingIds, id] })).not.toBe(id);
  },
);

it('edits maximum-length imported key/wire/layer IDs without rewriting saved references', () => {
  const suffix = '9'.repeat(127);
  const original = {
    ...createProject({ controllerId: 'nice_nano_v2' }),
    keys: [{ id: `k${suffix}`, xU: 0, yU: 0 }],
    wires: [
      {
        id: `w${suffix}`,
        start: { kind: 'key-pin' as const, keyId: `k${suffix}`, pin: 1 as const },
        end: { kind: 'free' as const, at: { xU: 2, yU: 2 } },
        bends: [],
      },
    ],
    layers: [{ id: `l${suffix}`, name: 'Base', bindings: {} }],
  };
  const imported = getResultValue(parseProjectFile(JSON.stringify(original)));
  const keyed = addKey(imported, { position: { xU: 3, yU: 0 } });
  const wired = addWire(keyed, {
    start: { kind: 'key-pin', keyId: `k${suffix}`, pin: 2 },
    end: { kind: 'free', at: { xU: 4, yU: 2 } },
    bends: [],
  });
  const layered = addLayer(wired, { reservedLayerIds: ['l1'] });
  expect(layered.layers.at(-1)?.id).toBe('l2');
  expect(layered.keys[0]).toEqual(original.keys[0]);
  expect(layered.wires[0]).toEqual(original.wires[0]);
  expect(parseProjectFile(getResultValue(serializeProject(layered)))).toEqual({
    ok: true,
    value: layered,
  });
});
