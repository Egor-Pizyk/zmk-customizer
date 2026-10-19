import { ANSI_104, ANSI_87, ANSI_60 } from './ansi-layouts';
import type { PresetLayout } from '@domain/project';
import { createPresetKeys } from './create-preset-keys';
import { COMPACT_84 } from './compact-84';
import { COMPACT_68 } from './compact-68';
import { ORTHO_60 } from './ortho-60';
import { ORTHO_48 } from './ortho-48';
import { CORNE_42 } from './corne-42';
import { LILY58_58 } from './lily58-58';
import { SOFLE_58 } from './sofle-58';

const MACROPAD_9 = {
  id: 'macropad-9',
  name: 'Macropad 3\u00D73',
  description: 'Nine square keys in a 3\u00D73 grid.',
  limitations:
    'QWERTY mode assigns digits 1\u20139; letters and other actions must be assigned manually.',
  topology: 'unibody',
  keys: createPresetKeys([
    ['N1', 0, 0],
    ['N2', 1, 0],
    ['N3', 2, 0],
    ['N4', 0, 1],
    ['N5', 1, 1],
    ['N6', 2, 1],
    ['N7', 0, 2],
    ['N8', 1, 2],
    ['N9', 2, 2],
  ]),
} as const satisfies PresetLayout;

export const KEYBOARD_PRESETS = [
  ANSI_104,
  ANSI_87,
  COMPACT_84,
  COMPACT_68,
  ANSI_60,
  ORTHO_60,
  ORTHO_48,
  MACROPAD_9,
  CORNE_42,
  LILY58_58,
  SOFLE_58,
] as const;
