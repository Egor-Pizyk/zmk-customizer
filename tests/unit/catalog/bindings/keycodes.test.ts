import { describe, expect, it } from 'vitest';
import keysHeader from '../../../../src/catalog/zmk/keys.h?raw';
import { KEYCODE_LEGENDS, KEYCODES, MODIFIER_KEYCODES, keycodeByName } from '@catalog/bindings';
import type { KeycodeCategory } from '@catalog/bindings';

const CATEGORIES: readonly KeycodeCategory[] = [
  'letters',
  'numbers',
  'symbols',
  'whitespace-editing',
  'navigation',
  'function',
  'modifiers',
  'keypad',
  'media-consumer',
  'locks',
  'international-language',
  'power',
  'other',
];

describe('KEYCODES from the vendored v0.3 keys.h', () => {
  it('has one entry per non-deprecated block', () => {
    // 373 description blocks; CURU and KSPC exist only as deprecated names.
    expect(keysHeader.match(/^\/\* .+ \*\/$/gmu)).toHaveLength(373);
    expect(KEYCODES).toHaveLength(371);
  });

  it('has unique canonical names and no deprecated names', () => {
    const names = KEYCODES.flatMap((keycode) => [keycode.name, ...keycode.aliases]);
    expect(new Set(names).size).toBe(names.length);
    for (const deprecated of ['BANG', 'NUM_1', 'M_MUTE', 'LSFT', 'CURU', 'KSPC']) {
      expect(keycodeByName.has(deprecated)).toBe(false);
    }
  });

  it('resolves aliases and shifted symbols', () => {
    expect(keycodeByName.get('N4')?.name).toBe('NUMBER_4');
    const dollar = keycodeByName.get('DOLLAR');
    expect(dollar?.implicitModifiers).toEqual(['LS']);
    expect(dollar?.usage).toEqual(keycodeByName.get('NUMBER_4')?.usage);
  });

  it('fills every category and links every entry to the v0.3 docs', () => {
    for (const category of CATEGORIES) {
      expect(KEYCODES.some((keycode) => keycode.category === category)).toBe(true);
    }
    for (const keycode of KEYCODES) {
      expect(keycode.docsUrl.startsWith('https://v0-3-branch.zmk.dev/docs/')).toBe(true);
      expect(keycode.description).not.toBe('');
    }
  });

  it('lists the eight modifiers', () => {
    expect(MODIFIER_KEYCODES.map((keycode) => keycode.name)).toEqual([
      'LEFT_CONTROL',
      'LEFT_SHIFT',
      'LEFT_ALT',
      'LEFT_GUI',
      'RIGHT_CONTROL',
      'RIGHT_SHIFT',
      'RIGHT_ALT',
      'RIGHT_GUI',
    ]);
  });

  it('has legends only for canonical names', () => {
    const canonicalNames = new Set(KEYCODES.map((keycode) => keycode.name));
    for (const name of Object.keys(KEYCODE_LEGENDS)) {
      expect(canonicalNames.has(name)).toBe(true);
    }
  });
});
