import { describe, expect, it } from 'vitest';
import { parseKeysHeader } from './parse-keys-header';

const HEADER = `/*
 * Copyright (c) 2020 The ZMK Contributors
 *
 * SPDX-License-Identifier: MIT
 */
#pragma once

/* Keyboard 4 and $ (Dollar) */
#define NUMBER_4 (ZMK_HID_USAGE(HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_4_AND_DOLLAR))
#define N4 (NUMBER_4)
#define NUM_4 (NUMBER_4) // WARNING: DEPRECATED (DO NOT USE)

/* Keyboard $ (Dollar) */
#define DOLLAR (LS(ZMK_HID_USAGE(HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_4_AND_DOLLAR)))
#define DLLR (DOLLAR)

/* Keyboard ( (Left Parenthesis) */
#define LEFT_PARENTHESIS                                                                           \\
    (LS(ZMK_HID_USAGE(HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_9_AND_LEFT_PARENTHESIS)))
#define LPAR (LEFT_PARENTHESIS)

/* Keyboard Currency Unit */
#define CURU (ZMK_HID_USAGE(HID_USAGE_KEY, HID_USAGE_KEY_CURRENCY_UNIT)) // WARNING: DEPRECATED (DO NOT USE)
`;

function sample(name: string, usage: string): string {
  return `/* ${name} */\n#define ${name} (ZMK_HID_USAGE(${usage}))\n`;
}

describe('parseKeysHeader', () => {
  it('reads canonical names, aliases, descriptions and implicit modifiers', () => {
    expect(parseKeysHeader(HEADER)).toEqual([
      {
        name: 'NUMBER_4',
        aliases: ['N4'],
        description: 'Keyboard 4 and $ (Dollar)',
        usage: { page: 'HID_USAGE_KEY', id: 'HID_USAGE_KEY_KEYBOARD_4_AND_DOLLAR' },
        implicitModifiers: [],
        category: 'numbers',
        docsUrl: 'https://v0-3-branch.zmk.dev/docs/keymaps/list-of-keycodes#numbers',
      },
      {
        name: 'DOLLAR',
        aliases: ['DLLR'],
        description: 'Keyboard $ (Dollar)',
        usage: { page: 'HID_USAGE_KEY', id: 'HID_USAGE_KEY_KEYBOARD_4_AND_DOLLAR' },
        implicitModifiers: ['LS'],
        category: 'symbols',
        docsUrl: 'https://v0-3-branch.zmk.dev/docs/keymaps/list-of-keycodes#symbols--punctuation',
      },
      {
        name: 'LEFT_PARENTHESIS',
        aliases: ['LPAR'],
        description: 'Keyboard ( (Left Parenthesis)',
        usage: { page: 'HID_USAGE_KEY', id: 'HID_USAGE_KEY_KEYBOARD_9_AND_LEFT_PARENTHESIS' },
        implicitModifiers: ['LS'],
        category: 'symbols',
        docsUrl: 'https://v0-3-branch.zmk.dev/docs/keymaps/list-of-keycodes#symbols--punctuation',
      },
    ]);
  });

  it('links keypad, language and editing keys to their own sections', () => {
    const header = [
      sample('KP_PLUS', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYPAD_PLUS'),
      sample('LANG1', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_LANG1'),
      sample('C_AC_COPY', 'HID_USAGE_CONSUMER, HID_USAGE_CONSUMER_AC_COPY'),
    ].join('');
    expect(parseKeysHeader(header).map((keycode) => keycode.docsUrl.split('#')[1])).toEqual([
      'keypad',
      'language',
      'editing',
    ]);
  });

  it.each([
    ['LEFT_SHIFT', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_LEFTSHIFT', 'modifiers'],
    ['RIGHT_GUI', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_RIGHT_GUI', 'modifiers'],
    ['A', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_A', 'letters'],
    ['F13', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_F13', 'function'],
    ['KP_N5', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYPAD_5', 'keypad'],
    ['UP_ARROW', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_UPARROW', 'navigation'],
    ['PAGE_DOWN', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_PAGEDOWN', 'navigation'],
    ['SPACE', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_SPACEBAR', 'whitespace-editing'],
    ['K_COPY', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_COPY', 'whitespace-editing'],
    ['K_MUTE', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_MUTE', 'media-consumer'],
    ['C_AC_PASTE', 'HID_USAGE_CONSUMER, HID_USAGE_CONSUMER_AC_PASTE', 'whitespace-editing'],
    ['CAPSLOCK', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_CAPS_LOCK', 'locks'],
    ['LANG1', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_LANG1', 'international-language'],
    ['MINUS', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_MINUS_AND_UNDERSCORE', 'symbols'],
    ['C_VOLUME_UP', 'HID_USAGE_CONSUMER, HID_USAGE_CONSUMER_VOLUME_INCREMENT', 'media-consumer'],
    ['SYSTEM_SLEEP', 'HID_USAGE_GD, HID_USAGE_GD_SYSTEM_SLEEP', 'power'],
    ['K_EXEC', 'HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_EXECUTE', 'other'],
    ['K_PLAY_PAUSE', 'HID_USAGE_KEY, 0xE8', 'other'],
  ])('puts %s into %s', (name, usage, category) => {
    expect(parseKeysHeader(sample(name, usage))[0]?.category).toBe(category);
  });
});
