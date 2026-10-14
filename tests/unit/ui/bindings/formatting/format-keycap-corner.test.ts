import type { Binding, Modifier } from '@domain';
import { formatKeycapCorner } from '@ui/bindings/formatting';
import { describe, expect, it } from 'vitest';

function kp(keycode: string, modifiers: readonly Modifier[] = []): Binding {
  return { kind: 'kp', key: { keycode, modifiers } };
}

describe('formatKeycapCorner', () => {
  it('hides the corner when it adds nothing over the face', () => {
    expect(formatKeycapCorner(kp('A'), 'A')).toBeUndefined();
    const unassigned: Record<string, Binding> = {};
    expect(formatKeycapCorner(unassigned['k0'], 'A')).toBeUndefined();
  });

  it('shows the exact keycode id for a plain key', () => {
    expect(formatKeycapCorner(kp('NUMBER_1'), '1')).toBe('NUMBER_1');
    expect(formatKeycapCorner(kp('DOLLAR'), '$')).toBe('DOLLAR');
  });

  it('shows modifier symbols with the id for a modified key', () => {
    expect(formatKeycapCorner(kp('NUMBER_1', ['LS']), '$')).toBe('⇧NUMBER_1');
  });

  it('hides a mixed corner identical to the face', () => {
    expect(formatKeycapCorner(kp('A', ['LC']), '⌃A')).toBeUndefined();
  });

  it('shows tap over hold for mixed bindings', () => {
    expect(
      formatKeycapCorner(
        {
          kind: 'mt',
          tap: { keycode: 'A', modifiers: [] },
          hold: { keycode: 'LEFT_CONTROL', modifiers: [] },
        },
        'A',
      ),
    ).toBe('A/LEFT_CONTROL');
    expect(formatKeycapCorner({ kind: 'sk', key: { keycode: 'A', modifiers: [] } }, 'A')).toBe(
      'A/STK',
    );
  });

  it('leaves behaviors without a code to the face legend', () => {
    expect(
      formatKeycapCorner({ kind: 'bt', command: 'BT_SEL', profile: 1 }, 'BT 1'),
    ).toBeUndefined();
    expect(formatKeycapCorner({ kind: 'trans' }, '▽')).toBeUndefined();
  });
});
