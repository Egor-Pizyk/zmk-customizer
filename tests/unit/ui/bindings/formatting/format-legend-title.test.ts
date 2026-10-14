import { formatLegendTitle } from '@ui/bindings/formatting';
import { describe, expect, it } from 'vitest';

describe('formatLegendTitle', () => {
  it('shows the full legend with the full name in parentheses', () => {
    expect(formatLegendTitle('C_RESET', 'Reset')).toBe('C_RESET (Reset)');
  });

  it('shows just the name when it matches the legend', () => {
    expect(formatLegendTitle('A', 'A')).toBe('A');
  });

  it('shows just the name without a legend', () => {
    expect(formatLegendTitle(undefined, 'Different actions')).toBe('Different actions');
  });
});
