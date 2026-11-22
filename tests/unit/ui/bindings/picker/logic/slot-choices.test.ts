import { KEYCODES } from '@catalog/bindings';
import type { Layer } from '@domain';
import { getSlotChoices } from '@ui/bindings/picker/logic';
import { describe, expect, it } from 'vitest';

const V0_3_DOCS = 'https://v0-3-branch.zmk.dev/docs/';
const MO_DOCS = `${V0_3_DOCS}keymaps/behaviors/layers#momentary-layer`;
const LAYERS: readonly Layer[] = [
  { id: 'l0', name: 'Base', bindings: {} },
  { id: 'l3', name: 'Nav & Sym', bindings: {} },
];
const CONTEXT = { layers: LAYERS, docsUrl: MO_DOCS };

describe('getSlotChoices (spec 006 FR-004–FR-006)', () => {
  const keyGroups = getSlotChoices({ kind: 'key' }, CONTEXT);

  it('offers every catalog keycode exactly once, with its code and aliases', () => {
    const ids = keyGroups.flatMap((group) => group.items.map((item) => item.id));
    expect(ids.toSorted()).toEqual(KEYCODES.map((keycode) => keycode.name).toSorted());
    const backspace = keyGroups
      .flatMap((group) => group.items)
      .find((item) => item.id === 'BACKSPACE');
    expect(backspace?.codes).toEqual(['BACKSPACE', 'BSPC']);
  });

  it('explains and links every choice to the v0.3 docs', () => {
    const slots = [
      'behavior',
      'key',
      'hold',
      'bt-command',
      'profile',
      'out-command',
      'layer',
    ] as const;
    for (const kind of slots) {
      for (const item of getSlotChoices({ kind }, CONTEXT).flatMap((group) => group.items)) {
        expect(item.description).not.toBe('');
        expect(item.docsUrl.startsWith(V0_3_DOCS)).toBe(true);
      }
    }
  });
});

it('lists every layer by position, name and node name, linked to the behavior docs (spec 007)', () => {
  const groups = getSlotChoices({ kind: 'layer' }, CONTEXT);
  expect(groups.map((group) => group.label)).toEqual(['Layers']);
  expect(groups[0]?.items).toMatchObject([
    {
      id: 'l0',
      legend: '0',
      name: 'Base',
      codes: ['0', 'base_layer'],
      description: 'Layer 0, the base layer, always on',
      docsUrl: MO_DOCS,
      pick: { kind: 'layer', layerId: 'l0' },
    },
    {
      id: 'l3',
      legend: '1',
      name: 'Nav & Sym',
      codes: ['1', 'nav_sym_layer'],
      description: 'Layer 1 in keymap order',
      pick: { kind: 'layer', layerId: 'l3' },
    },
  ]);
});
