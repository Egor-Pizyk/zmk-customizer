import { describe, expect, it } from 'vitest';
import { KEYCODES } from '@catalog/bindings';
import type { Layer } from '@domain';
import { formatSlotPrompt, getSlotChoices } from '@ui/bindings';

const V0_3_DOCS = 'https://v0-3-branch.zmk.dev/docs/';
const MO_DOCS = `${V0_3_DOCS}keymaps/behaviors/layers#momentary-layer`;
const LAYERS: readonly Layer[] = [
  { id: 'l0', name: 'Base', bindings: {} },
  { id: 'l3', name: 'Nav & Sym', bindings: {} },
];
const CONTEXT = { layers: LAYERS, docsUrl: MO_DOCS };

function countChoices(kind: 'hold' | 'bt-command' | 'profile' | 'out-command'): number {
  return getSlotChoices({ kind }, CONTEXT).flatMap((group) => group.items).length;
}

describe('getSlotChoices (spec 006 FR-004–FR-006)', () => {
  const keyGroups = getSlotChoices({ kind: 'key' }, CONTEXT);

  it('groups keys in a fixed order with rare media codes last', () => {
    expect(keyGroups.map((group) => group.label)).toEqual([
      'Letters',
      'Numbers',
      'Symbols',
      'Editing',
      'Navigation',
      'Modifiers',
      'F keys',
      'Media',
      'Keypad',
      'Locks',
      'International',
      'Power',
      'Other',
      'More media and consumer',
    ]);
    expect(keyGroups[0]?.items.slice(0, 3).map((item) => item.id)).toEqual(['A', 'B', 'C']);
    expect(keyGroups.find((group) => group.label === 'Media')?.items).toHaveLength(13);
  });

  it('offers every catalog keycode exactly once, with its code and aliases', () => {
    const ids = keyGroups.flatMap((group) => group.items.map((item) => item.id));
    expect(ids.toSorted()).toEqual(KEYCODES.map((keycode) => keycode.name).toSorted());
    const backspace = keyGroups
      .flatMap((group) => group.items)
      .find((item) => item.id === 'BACKSPACE');
    expect(backspace?.codes).toEqual(['BACKSPACE', 'BSPC']);
  });

  it('groups behaviors and offers the fixed choices of the other slots', () => {
    expect(
      getSlotChoices({ kind: 'behavior' }, CONTEXT).map(
        (group) => `${group.label}: ${group.items.map((item) => item.legend).join(' ')}`,
      ),
    ).toEqual([
      'Send a key: &kp &mt &sk &kt',
      'Layers: &mo &lt &tog &to &sl',
      'Special: &trans &none &caps_word &key_repeat &gresc',
      'Connection: &bt &out',
      'Firmware: &sys_reset &bootloader',
      'Your behaviors: tap-dance mod-morph',
    ]);
    expect([
      countChoices('hold'),
      countChoices('bt-command'),
      countChoices('profile'),
      countChoices('out-command'),
    ]).toEqual([8, 6, 5, 3]);
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

it('asks what the open slot needs (FR-003)', () => {
  expect(formatSlotPrompt({ kind: 'layer' })).toBe('Which layer?');
  expect(formatSlotPrompt({ kind: 'behavior' })).toBe('What should the key do?');
  expect(formatSlotPrompt({ kind: 'dance-tap', index: 1 })).toBe('Which key for tap 2?');
  expect(formatSlotPrompt({ kind: 'morph-side', side: 'morphed' })).toBe(
    'Which key while the triggers are held?',
  );
});
