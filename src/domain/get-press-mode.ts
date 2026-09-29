import { assertNever } from './assert-never';
import type { PressMode } from './set-press-mode';
import type { Binding } from './types';

/** Undefined: the binding sends no key, so press mode does not apply (spec 004 FR-012). */
export function getPressMode(binding: Binding | undefined): PressMode | undefined {
  switch (binding?.kind) {
    case 'kp':
    case 'mt': {
      return 'normal';
    }
    case 'sk': {
      return 'sticky';
    }
    case 'kt': {
      return 'toggle';
    }
    case undefined:
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'bt':
    case 'out':
    case 'sys_reset':
    case 'bootloader': {
      return undefined;
    }
    default: {
      return assertNever(binding);
    }
  }
}
