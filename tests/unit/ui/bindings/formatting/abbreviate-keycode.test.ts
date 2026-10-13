import { describe, expect, it } from 'vitest';
import { abbreviateKeycodeNames } from '@ui/bindings';

describe('abbreviateKeycodeNames', () => {
  it('keeps the prefix and merges the rest without separators', () => {
    const legends = abbreviateKeycodeNames(['C_AC_REFRESH', 'KP_LEFT_PARENTHESIS']);
    expect(legends.get('C_AC_REFRESH')).toBe('C_ACRF');
    expect(legends.get('KP_LEFT_PARENTHESIS')).toBe('KP_LPRN');
  });

  it('keeps left/right pairs distinct', () => {
    const legends = abbreviateKeycodeNames(['KP_LEFT_PARENTHESIS', 'KP_RIGHT_PARENTHESIS']);
    expect(legends.get('KP_LEFT_PARENTHESIS')).toBe('KP_LPRN');
    expect(legends.get('KP_RIGHT_PARENTHESIS')).toBe('KP_RPRN');
  });

  it('merges middle initials with the skeleton of the last word', () => {
    expect(abbreviateKeycodeNames(['C_MENU_INCREASE']).get('C_MENU_INCREASE')).toBe('C_MNCRS');
  });

  it('shortens a single word to its consonant skeleton', () => {
    const legends = abbreviateKeycodeNames(['SYSREQ', 'SEPARATOR']);
    expect(legends.get('SYSREQ')).toBe('SYSRQ');
    expect(legends.get('SEPARATOR')).toBe('SPRTR');
  });

  it('resolves collisions with a digit suffix', () => {
    const legends = abbreviateKeycodeNames(['AB_CD_EF', 'AB_CE_EF']);
    expect(legends.get('AB_CD_EF')).toBe('AB_CF');
    expect(legends.get('AB_CE_EF')).toBe('AB_CF2');
  });

  it('never exceeds seven characters', () => {
    const legends = abbreviateKeycodeNames(['C_KEYBOARD_INPUT_ASSIST_PREVIOUS_GROUP']);
    expect(legends.get('C_KEYBOARD_INPUT_ASSIST_PREVIOUS_GROUP')).toBe('C_KIAPG');
  });
});
