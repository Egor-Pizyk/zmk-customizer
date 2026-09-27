import { toShieldName } from './to-shield-name';
import type { Project, ValidationIssue } from './types';

const SHIELD_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/u;
// CONFIG_ZMK_KEYBOARD_NAME is checked against BT_DEVICE_NAME_MAX (16) with strlen, i.e. in bytes
// (docs/zmk/kconfig-options.md §1).
const MAX_KEYBOARD_NAME_BYTES = 16;

function validateShieldName(project: Project): readonly ValidationIssue[] {
  if (project.shieldName === undefined) {
    return toShieldName(project.name) === ''
      ? [
          {
            code: 'shield-name-empty',
            message:
              'The keyboard name has no letters or digits usable in file names. Use at least one Latin letter or digit, or set a technical name.',
            path: ['name'],
          },
        ]
      : [];
  }
  return SHIELD_NAME_PATTERN.test(project.shieldName)
    ? []
    : [
        {
          code: 'shield-name-invalid',
          message:
            'The technical name may use only lowercase letters, digits and _, and must not start with a digit.',
          path: ['shieldName'],
        },
      ];
}

function validateKeyboardName(project: Project): readonly ValidationIssue[] {
  const byteCount = new TextEncoder().encode(project.name).length;
  if (byteCount <= MAX_KEYBOARD_NAME_BYTES) {
    return [];
  }
  return [
    {
      code: 'keyboard-name-too-long',
      message: `The keyboard name is ${byteCount} bytes; keyboards can announce at most ${MAX_KEYBOARD_NAME_BYTES}. Shorten it (non-Latin letters count as 2–3).`,
      path: ['name'],
    },
  ];
}

export function validateProject(project: Project): readonly ValidationIssue[] {
  return [...validateShieldName(project), ...validateKeyboardName(project)];
}
