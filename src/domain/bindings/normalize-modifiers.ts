import { MODIFIERS } from '../types';
import type { Modifier } from '../types';

/** Unique modifiers in MODIFIERS order, so equal strokes are deep-equal (spec 004). */
export function normalizeModifiers(modifiers: readonly Modifier[]): readonly Modifier[] {
  return MODIFIERS.filter((modifier) => modifiers.includes(modifier));
}
