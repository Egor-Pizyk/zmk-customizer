import type { Modifier } from '../../domain/types';

export const MODIFIER_LABELS: Record<Modifier, string> = {
  LC: 'Left Ctrl',
  LS: 'Left Shift',
  LA: 'Left Alt',
  LG: 'Left GUI',
  RC: 'Right Ctrl',
  RS: 'Right Shift',
  RA: 'Right Alt',
  RG: 'Right GUI',
};

// Right-hand modifiers carry an R so they differ from left ones (spec 004 FR-006).
export const MODIFIER_SYMBOLS: Record<Modifier, string> = {
  LC: '⌃',
  LS: '⇧',
  LA: '⌥',
  LG: '⌘',
  RC: 'R⌃',
  RS: 'R⇧',
  RA: 'R⌥',
  RG: 'R⌘',
};
