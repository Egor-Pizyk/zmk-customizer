import { describe, expect, it } from 'vitest';
import { BEHAVIORS } from './behaviors';
import { BLUETOOTH_COMMANDS, BLUETOOTH_PROFILE_COUNT } from './bluetooth-commands';
import { OUTPUT_COMMANDS } from './output-commands';

const V0_3_DOCS = 'https://v0-3-branch.zmk.dev/docs/';

describe('binding catalog tables', () => {
  it('lists the 13 built-in behaviors of spec 004 plus tap-dance and mod-morph in picker order', () => {
    expect(BEHAVIORS.map((behavior) => behavior.id)).toEqual([
      'kp',
      'mt',
      'sk',
      'kt',
      'trans',
      'none',
      'caps_word',
      'key_repeat',
      'gresc',
      'bt',
      'out',
      'sys_reset',
      'bootloader',
      'tap_dance',
      'mod_morph',
    ]);
  });

  it('tags built-ins with their keymap label and user-defined kinds without one (spec 006)', () => {
    expect(BEHAVIORS.map((behavior) => `${behavior.group}: ${behavior.tag}`)).toEqual([
      'Send a key: &kp',
      'Send a key: &mt',
      'Send a key: &sk',
      'Send a key: &kt',
      'Special: &trans',
      'Special: &none',
      'Special: &caps_word',
      'Special: &key_repeat',
      'Special: &gresc',
      'Connection: &bt',
      'Connection: &out',
      'Firmware: &sys_reset',
      'Firmware: &bootloader',
      'Your behaviors: tap-dance',
      'Your behaviors: mod-morph',
    ]);
  });

  it('explains and links every entry to the v0.3 docs (constitution V)', () => {
    for (const entry of [...BEHAVIORS, ...BLUETOOTH_COMMANDS, ...OUTPUT_COMMANDS]) {
      expect(entry.label).not.toBe('');
      expect(entry.description).not.toBe('');
      expect(entry.docsUrl.startsWith(V0_3_DOCS)).toBe(true);
    }
  });

  it('offers only v0.3 Bluetooth and output commands', () => {
    expect(BLUETOOTH_COMMANDS.map((command) => command.id)).toEqual([
      'BT_SEL',
      'BT_DISC',
      'BT_NXT',
      'BT_PRV',
      'BT_CLR',
      'BT_CLR_ALL',
    ]);
    expect(BLUETOOTH_PROFILE_COUNT).toBe(5);
    expect(OUTPUT_COMMANDS.map((command) => command.id)).toEqual(['OUT_TOG', 'OUT_USB', 'OUT_BLE']);
  });
});
