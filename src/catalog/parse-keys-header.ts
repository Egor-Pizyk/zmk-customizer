import type { Modifier } from '../domain/types';

export type KeycodeCategory =
  | 'letters'
  | 'numbers'
  | 'symbols'
  | 'whitespace-editing'
  | 'navigation'
  | 'function'
  | 'modifiers'
  | 'keypad'
  | 'media-consumer'
  | 'locks'
  | 'international-language'
  | 'power'
  | 'other';

export type Keycode = {
  /** Canonical `#define`, e.g. 'NUMBER_4'. */
  readonly name: string;
  /** Non-deprecated aliases, e.g. ['N4']. */
  readonly aliases: readonly string[];
  /** The header comment, e.g. 'Keyboard 4 and $ (Dollar)'. */
  readonly description: string;
  /** HID page and usage as written in the header; equal usage = same physical key (R5). */
  readonly usage: { readonly page: string; readonly id: string };
  /** ['LS'] for shifted symbols such as DOLLAR. */
  readonly implicitModifiers: readonly Modifier[];
  readonly category: KeycodeCategory;
  readonly docsUrl: string;
};

// Anchors of the v0.3 list-of-keycodes page (Docusaurus slugs of its mdx headings, research R3).
const ANCHOR_BY_CATEGORY: Record<KeycodeCategory, string> = {
  letters: 'letters',
  numbers: 'numbers',
  symbols: 'symbols--punctuation',
  'whitespace-editing': 'control--whitespace',
  navigation: 'navigation',
  function: 'f-keys',
  modifiers: 'modifiers',
  keypad: 'keypad',
  'media-consumer': 'media',
  locks: 'locks',
  'international-language': 'international',
  power: 'power--lock',
  other: 'miscellaneous',
};

const DOCS_URL = 'https://v0-3-branch.zmk.dev/docs/keymaps/list-of-keycodes';

const COMMENT_PATTERN = /^\/\* (.+) \*\/$/u;
const DEFINE_PATTERN = /^#define (\w+)\s+(\S+(?: \S+)*?)\s*(?:\/\/.*)?$/u;
const USAGE_PATTERN = /^\((LS\()?ZMK_HID_USAGE\((\w+), (\w+)\)\)?\)$/u;
const USAGE_PREFIX_PATTERN = /^HID_USAGE_(?:KEY_KEYBOARD_|KEY_|CONSUMER_|GD_)/u;

type Define = { readonly name: string; readonly value: string };
type Block = { readonly description: string; readonly defines: Define[] };

// Header layout (docs/zmk/keymap.md §4): a `/* description */` comment, then the canonical
// define, then aliases `#define ALIAS (CANONICAL)`; deprecated lines are skipped.
function readBlocks(raw: string): readonly Block[] {
  const blocks: Block[] = [];
  for (const line of raw.replaceAll('\\\n', '').split('\n')) {
    const description = COMMENT_PATTERN.exec(line.trim())?.[1];
    if (description !== undefined) {
      blocks.push({ description, defines: [] });
      continue;
    }
    const define = DEFINE_PATTERN.exec(line);
    const block = blocks.at(-1);
    if (define?.[1] === undefined || define[2] === undefined || block === undefined) {
      continue;
    }
    if (!line.includes('DEPRECATED')) {
      block.defines.push({ name: define[1], value: define[2] });
    }
  }
  return blocks;
}

const KEY_RULES: readonly (readonly [RegExp, KeycodeCategory])[] = [
  [/^(?:LEFT|RIGHT)_?(?:CONTROL|SHIFT|ALT|GUI)$/u, 'modifiers'],
  [/^[A-Z]$/u, 'letters'],
  [/^\d_AND_/u, 'numbers'],
  [/^F\d+$/u, 'function'],
  [/^KEYPAD_/u, 'keypad'],
  [/ARROW$|^(?:HOME|END|PAGEUP|PAGEDOWN|INSERT|DELETE_FORWARD)$/u, 'navigation'],
  [
    /^(?:RETURN_ENTER|RETURN|ESCAPE|DELETE_BACKSPACE|TAB|SPACEBAR|CUT|COPY|PASTE|UNDO|AGAIN|FIND)$/u,
    'whitespace-editing',
  ],
  [/LOCK/u, 'locks'],
  [/^(?:MUTE|VOLUME_UP|VOLUME_DOWN)$/u, 'media-consumer'],
  [/^(?:INTERNATIONAL|LANG)\d$/u, 'international-language'],
  [/_AND_|^NON_US_/u, 'symbols'],
];

function toCategory(usage: Keycode['usage'], isShifted: boolean): KeycodeCategory {
  const usageName = usage.id.replace(USAGE_PREFIX_PATTERN, '');
  if (usage.page === 'HID_USAGE_GD') {
    return 'power';
  }
  if (usage.page === 'HID_USAGE_CONSUMER') {
    return /^AC_(?:CUT|COPY|PASTE|UNDO|REDO_REPEAT)$/u.test(usageName)
      ? 'whitespace-editing'
      : 'media-consumer';
  }
  if (isShifted) {
    return 'symbols';
  }
  return KEY_RULES.find(([pattern]) => pattern.test(usageName))?.[1] ?? 'other';
}

// The page splits some categories into sections of their own (zmk-reviewer, spec 004 R3).
function toAnchor(category: KeycodeCategory, usage: Keycode['usage']): string {
  const usageName = usage.id.replace(USAGE_PREFIX_PATTERN, '');
  if (/^LANG\d$/u.test(usageName)) {
    return 'language';
  }
  if (/^(?:AC_)?(?:CUT|COPY|PASTE|UNDO|REDO_REPEAT|AGAIN)$/u.test(usageName)) {
    return 'editing';
  }
  return ANCHOR_BY_CATEGORY[category];
}

function toKeycode(block: Block): Keycode | undefined {
  const [canonical, ...rest] = block.defines;
  const match = canonical === undefined ? undefined : USAGE_PATTERN.exec(canonical.value);
  if (canonical === undefined || match?.[2] === undefined || match[3] === undefined) {
    return undefined;
  }
  const usage = { page: match[2], id: match[3] };
  const isShifted = match[1] !== undefined;
  const category = toCategory(usage, isShifted);
  return {
    name: canonical.name,
    aliases: rest
      .filter((define) => define.value === `(${canonical.name})`)
      .map((define) => define.name),
    description: block.description,
    usage,
    implicitModifiers: isShifted ? ['LS'] : [],
    category,
    docsUrl: `${DOCS_URL}#${toAnchor(category, usage)}`,
  };
}

export function parseKeysHeader(raw: string): readonly Keycode[] {
  return readBlocks(raw).flatMap((block) => toKeycode(block) ?? []);
}
