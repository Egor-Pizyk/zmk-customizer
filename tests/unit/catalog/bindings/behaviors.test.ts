import { describe, expect, it } from 'vitest';
import {
  BEHAVIORS,
  BLUETOOTH_COMMANDS,
  BLUETOOTH_PROFILE_COUNT,
  OUTPUT_COMMANDS,
} from '@catalog/bindings';

const V0_3_DOCS = 'https://v0-3-branch.zmk.dev/docs/';

describe('binding catalog tables', () => {
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
