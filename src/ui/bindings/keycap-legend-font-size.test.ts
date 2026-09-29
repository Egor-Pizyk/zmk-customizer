import { describe, expect, it } from 'vitest';
import { cornerLegendFontSize, tapLegendFontSize } from './keycap-legend-font-size';

describe('tapLegendFontSize', () => {
  it('keeps short legends at the base size', () => {
    expect(tapLegendFontSize('A')).toBe(0.28);
    expect(tapLegendFontSize('🔇')).toBe(0.28);
  });

  it('shrinks a seven-grapheme legend to fit the keycap top', () => {
    expect(tapLegendFontSize('C_MNCRS')).toBeCloseTo(0.19, 2);
  });

  it('never grows past the base size', () => {
    expect(tapLegendFontSize('')).toBe(0.28);
  });
});

describe('cornerLegendFontSize', () => {
  it('keeps short codes at the base size', () => {
    expect(cornerLegendFontSize('N4')).toBe(0.085);
  });

  it('shrinks a long id to fit the keycap corner', () => {
    expect(cornerLegendFontSize('C_BRIGHTNESS_MINIMUM')).toBeLessThan(0.085);
  });
});
