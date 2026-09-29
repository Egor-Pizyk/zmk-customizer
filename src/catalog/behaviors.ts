import type { BehaviorId } from '../domain/types';

/** What step 2 of the Action panel asks for; 'none' = applied from step 1 (spec 004 FR-009). */
export type BehaviorChoices =
  | 'none'
  | 'key'
  | 'hold-tap'
  | 'bluetooth'
  | 'output'
  | 'tap-dance'
  | 'mod-morph';

export type BehaviorEntry = {
  readonly id: BehaviorId;
  readonly label: string;
  readonly description: string;
  readonly choices: BehaviorChoices;
  readonly docsUrl: string;
};

const DOCS = 'https://v0-3-branch.zmk.dev/docs/keymaps/behaviors';

// Built-in behaviors that build without extra Kconfig (docs/zmk/behaviors.md §1); layer,
// lighting, mouse, power-off and Studio behaviors are out of scope (spec 004 FR-017).
export const BEHAVIORS = [
  {
    id: 'kp',
    label: 'Send a key',
    description: 'Sends a key, optionally with Ctrl, Shift, Alt or GUI held.',
    choices: 'key',
    docsUrl: `${DOCS}/key-press`,
  },
  {
    id: 'mt',
    label: 'Modifier on hold, key on tap',
    description: 'Acts as a modifier while held and sends a key when tapped (mod-tap).',
    choices: 'hold-tap',
    docsUrl: `${DOCS}/hold-tap#mod-tap`,
  },
  {
    id: 'sk',
    label: 'Sticky key',
    description: 'Keeps a key, usually a modifier, active for the next key press.',
    choices: 'key',
    docsUrl: `${DOCS}/sticky-key`,
  },
  {
    id: 'kt',
    label: 'Key toggle',
    description: 'Presses a key and keeps it pressed until the key is pressed again.',
    choices: 'key',
    docsUrl: `${DOCS}/key-toggle`,
  },
  {
    id: 'trans',
    label: 'Pass-through',
    description: 'Uses the action of the next active layer below.',
    choices: 'none',
    docsUrl: `${DOCS}/misc#transparent`,
  },
  {
    id: 'none',
    label: 'Do nothing',
    description: 'Ignores the key press.',
    choices: 'none',
    docsUrl: `${DOCS}/misc#none`,
  },
  {
    id: 'caps_word',
    label: 'Caps word',
    description: 'Types capital letters until a space or other word-breaking key.',
    choices: 'none',
    docsUrl: `${DOCS}/caps-word`,
  },
  {
    id: 'key_repeat',
    label: 'Key repeat',
    description: 'Sends the last key that was sent again.',
    choices: 'none',
    docsUrl: `${DOCS}/key-repeat`,
  },
  {
    id: 'gresc',
    label: 'Grave/Escape',
    description: 'Sends Escape, or ` when Shift or GUI is held.',
    choices: 'none',
    docsUrl: `${DOCS}/mod-morph#behavior-binding`,
  },
  {
    id: 'bt',
    label: 'Bluetooth',
    description: 'Selects, switches, disconnects or clears Bluetooth profiles.',
    choices: 'bluetooth',
    docsUrl: `${DOCS}/bluetooth#bluetooth-command-defines`,
  },
  {
    id: 'out',
    label: 'Output',
    description: 'Chooses whether keys go over USB or Bluetooth.',
    choices: 'output',
    docsUrl: `${DOCS}/outputs#output-command-defines`,
  },
  {
    id: 'sys_reset',
    label: 'Reset',
    description: 'Restarts the keyboard.',
    choices: 'none',
    docsUrl: `${DOCS}/reset#reset`,
  },
  {
    id: 'bootloader',
    label: 'Bootloader',
    description: 'Restarts into the bootloader so new firmware can be flashed.',
    choices: 'none',
    docsUrl: `${DOCS}/reset#bootloader-reset`,
  },
  {
    id: 'tap_dance',
    label: 'Tap dance',
    description: 'Sends one action on a single tap, another on a double tap, and so on.',
    choices: 'tap-dance',
    docsUrl: `${DOCS}/tap-dance`,
  },
  {
    id: 'mod_morph',
    label: 'Mod-morph',
    description: 'Sends one key normally and another while a chosen modifier is held.',
    choices: 'mod-morph',
    docsUrl: `${DOCS}/mod-morph`,
  },
] as const satisfies readonly BehaviorEntry[];

// One row of the behavior control, in panel order.
export type BehaviorKind = (typeof BEHAVIORS)[number];

// Compile-time guard: every BehaviorId is offered exactly once in panel order. `satisfies`
// above rejects extra ids; this rejects a missing one (a plain array cannot express fullness).
type MissingBehavior = Exclude<BehaviorId, (typeof BEHAVIORS)[number]['id']>;
const assertNoMissingBehavior: MissingBehavior extends never ? true : never = true;
void assertNoMissingBehavior;
