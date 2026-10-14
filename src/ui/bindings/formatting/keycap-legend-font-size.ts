import { countGraphemes } from './format-binding-legend';
// The tap glyph shrinks past four graphemes so seven fit the 0.76u keycap top
// (spec 004 FR-006). Counted in graphemes so symbols and emoji count once.

const BASE_TAP_FONT_U = 0.28;
const TAP_MAX_WIDTH_U = 0.72;
const BASE_CORNER_FONT_U = 0.085;
const CORNER_MAX_WIDTH_U = 0.6;
const GLYPH_ADVANCE_RATIO = 0.55;

export function tapLegendFontSize(legendTap: string): number {
  const graphemes = countGraphemes(legendTap);
  if (graphemes === 0) {
    return BASE_TAP_FONT_U;
  }
  return Math.min(BASE_TAP_FONT_U, TAP_MAX_WIDTH_U / (GLYPH_ADVANCE_RATIO * graphemes));
}

// The corner code is tiny by design; it scales the same way so a long id still fits.
export function cornerLegendFontSize(corner: string): number {
  const graphemes = countGraphemes(corner);
  if (graphemes === 0) {
    return BASE_CORNER_FONT_U;
  }
  return Math.min(BASE_CORNER_FONT_U, CORNER_MAX_WIDTH_U / (GLYPH_ADVANCE_RATIO * graphemes));
}
