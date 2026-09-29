import { describe, expect, it } from 'vitest';
import { KEYCODES } from '../../catalog/keycodes';
import { PICKER_TABS, findPickerTabId, isCurrentPickerItem } from './picker-tabs';

const ITEMS = PICKER_TABS.flatMap((tab) => tab.rows.flatMap((row) => row.items));
const KEYCODE_IDS = ITEMS.flatMap((item) =>
  item.pick.kind === 'keycode' ? [item.pick.keycode] : [],
);

describe('PICKER_TABS', () => {
  it('has the seven tabs of spec 004 FR-010 in order', () => {
    expect(PICKER_TABS.map((tab) => tab.label)).toEqual([
      'Basic',
      'Nav',
      'F keys',
      'Media',
      'Mods',
      'System',
      'More',
    ]);
  });

  it('offers every catalog keycode exactly once', () => {
    expect(KEYCODE_IDS.toSorted()).toEqual(KEYCODES.map((keycode) => keycode.name).toSorted());
  });

  it('lays Basic out as a US keyboard', () => {
    const basic = PICKER_TABS[0]?.rows.map((row) => row.items.map((item) => item.legend).join(' '));
    expect(basic?.[1]).toBe('⇥ Q W E R T Y U I O P [ ] \\');
    expect(basic?.at(-1)).toBe('␣');
  });

  it('puts one-click Bluetooth profiles and firmware actions in System (FR-013)', () => {
    const system = PICKER_TABS.find((tab) => tab.id === 'system');
    expect(system?.rows.map((row) => `${row.label}: ${row.items.length}`)).toEqual([
      'Special: 5',
      'Bluetooth select: 5',
      'Bluetooth disconnect: 5',
      'Bluetooth: 4',
      'Output: 3',
      'Firmware: 2',
      'Tap dance: 1',
      'Mod-morph: 1',
    ]);
  });

  it('explains and links every item', () => {
    for (const item of ITEMS) {
      expect(item.name).not.toBe('');
      expect(item.description).not.toBe('');
      expect(item.docsUrl.startsWith('https://v0-3-branch.zmk.dev/docs/')).toBe(true);
    }
  });
});

describe('current item and tab (FR-009a)', () => {
  const mt = {
    kind: 'mt',
    hold: { keycode: 'LSHIFT', modifiers: [] },
    tap: { keycode: 'RET', modifiers: ['LC'] },
  } as const;

  it('marks the key a binding sends, by canonical name', () => {
    expect(ITEMS.filter((item) => isCurrentPickerItem(item, mt)).map((item) => item.id)).toEqual([
      'RETURN',
    ]);
  });

  it('finds the tab of the current action', () => {
    expect(findPickerTabId(mt)).toBe('basic');
    expect(findPickerTabId({ kind: 'bt', command: 'BT_SEL', profile: 2 })).toBe('system');
    expect(findPickerTabId({ kind: 'kp', key: { keycode: 'F13', modifiers: [] } })).toBe(
      'function',
    );
    expect(
      findPickerTabId({
        kind: 'tap_dance',
        taps: [{ keycode: 'A', modifiers: [] }],
        tappingTermMs: 200,
      }),
    ).toBe('system');
    expect(
      findPickerTabId({
        kind: 'mod_morph',
        normal: { keycode: 'A', modifiers: [] },
        morphed: { keycode: 'B', modifiers: [] },
        mods: ['LS'],
      }),
    ).toBe('system');
  });
});
