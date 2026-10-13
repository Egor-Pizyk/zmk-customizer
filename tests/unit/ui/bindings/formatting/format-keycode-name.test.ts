import { describe, expect, it } from 'vitest';
import { KEYCODES } from '@catalog/bindings';
import { formatKeycodeName } from '@ui/bindings';

describe('formatKeycodeName', () => {
  it('keeps unique names as they are', () => {
    expect(formatKeycodeName('A')).toBe('A');
    expect(formatKeycodeName('N4')).toBe('4');
    expect(formatKeycodeName('C_AC_REFRESH')).toBe('AC Refresh');
  });

  it('qualifies colliding names with the canonical id', () => {
    expect(formatKeycodeName('K_STOP')).toBe('Stop (K_STOP)');
    expect(formatKeycodeName('K_STOP2')).toBe('Stop (K_STOP2)');
    expect(formatKeycodeName('K_POWER')).toBe('Power (K_POWER)');
    expect(formatKeycodeName('C_POWER')).toBe('Power (C_POWER)');
    expect(formatKeycodeName('TILDE')).toBe('~ (Tilde) (TILDE)');
    expect(formatKeycodeName('TILDE2')).toBe('~ (Tilde) (TILDE2)');
  });

  it('gives every keycode a unique display name', () => {
    const names = KEYCODES.map((keycode) => formatKeycodeName(keycode.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it('names an unknown keycode after its id', () => {
    expect(formatKeycodeName('BANG')).toBe('Unknown key BANG');
  });
});
