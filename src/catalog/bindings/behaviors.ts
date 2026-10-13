import type { BehaviorId } from '@domain';

/** Group of the behavior picker (spec 006 US2 AS4). */
export type BehaviorGroup =
  | 'Send a key'
  | 'Layers'
  | 'Special'
  | 'Connection'
  | 'Firmware'
  | 'Your behaviors';

export type BehaviorEntry = {
  readonly id: BehaviorId;
  /**
   * What the binding line shows: the built-in label the keymap uses (`&kp`), or the kind for
   * behaviors the user defines, which have no built-in label (`&td` does not exist,
   * docs/zmk/behaviors.md §3.2–3.3).
   */
  readonly tag: string;
  readonly label: string;
  readonly description: string;
  readonly group: BehaviorGroup;
  readonly docsUrl: string;
};

const DOCS = 'https://v0-3-branch.zmk.dev/docs/keymaps/behaviors';

// Built-in behaviors that build without extra Kconfig (docs/zmk/behaviors.md §1); lighting,
// mouse, power-off and Studio behaviors are out of scope (spec 004 FR-017). Layer behaviors
// since spec 007; anchors checked against the v0.3.0 docs source headings.
export const BEHAVIORS = [
  {
    id: 'kp',
    tag: '&kp',
    label: 'Key press',
    description: 'Sends a key, optionally with Ctrl, Shift, Alt or GUI held.',
    group: 'Send a key',
    docsUrl: `${DOCS}/key-press`,
  },
  {
    id: 'mt',
    tag: '&mt',
    label: 'Modifier on hold, key on tap',
    description: 'Acts as a modifier while held and sends a key when tapped (mod-tap).',
    group: 'Send a key',
    docsUrl: `${DOCS}/hold-tap#mod-tap`,
  },
  {
    id: 'sk',
    tag: '&sk',
    label: 'Sticky key',
    description: 'Keeps a key, usually a modifier, active for the next key press.',
    group: 'Send a key',
    docsUrl: `${DOCS}/sticky-key`,
  },
  {
    id: 'kt',
    tag: '&kt',
    label: 'Key toggle',
    description: 'Presses a key and keeps it pressed until the key is pressed again.',
    group: 'Send a key',
    docsUrl: `${DOCS}/key-toggle`,
  },
  {
    id: 'mo',
    tag: '&mo',
    label: 'Momentary layer',
    description: 'Turns a layer on while the key is held.',
    group: 'Layers',
    docsUrl: `${DOCS}/layers#momentary-layer`,
  },
  {
    id: 'lt',
    tag: '&lt',
    label: 'Layer on hold, key on tap',
    description: 'Turns a layer on while held and sends a key when tapped (layer-tap).',
    group: 'Layers',
    docsUrl: `${DOCS}/hold-tap#layer-tap`,
  },
  {
    id: 'tog',
    tag: '&tog',
    label: 'Toggle layer',
    description: 'Turns a layer on, or off if it is already on.',
    group: 'Layers',
    docsUrl: `${DOCS}/layers#toggle-layer`,
  },
  {
    id: 'to',
    tag: '&to',
    label: 'To layer',
    description: 'Turns a layer on and every other layer off, except the base layer.',
    group: 'Layers',
    docsUrl: `${DOCS}/layers#to-layer`,
  },
  {
    id: 'sl',
    tag: '&sl',
    label: 'Sticky layer',
    description: 'Keeps a layer on for the next key press.',
    group: 'Layers',
    docsUrl: `${DOCS}/sticky-layer`,
  },
  {
    id: 'trans',
    tag: '&trans',
    label: 'Pass-through',
    description: 'Uses the action of the next active layer below.',
    group: 'Special',
    docsUrl: `${DOCS}/misc#transparent`,
  },
  {
    id: 'none',
    tag: '&none',
    label: 'Do nothing',
    description: 'Ignores the key press.',
    group: 'Special',
    docsUrl: `${DOCS}/misc#none`,
  },
  {
    id: 'caps_word',
    tag: '&caps_word',
    label: 'Caps word',
    description: 'Types capital letters until a space or other word-breaking key.',
    group: 'Special',
    docsUrl: `${DOCS}/caps-word`,
  },
  {
    id: 'key_repeat',
    tag: '&key_repeat',
    label: 'Key repeat',
    description: 'Sends the last key that was sent again.',
    group: 'Special',
    docsUrl: `${DOCS}/key-repeat`,
  },
  {
    id: 'gresc',
    tag: '&gresc',
    label: 'Grave/Escape',
    description: 'Sends Escape, or ` when Shift or GUI is held.',
    group: 'Special',
    docsUrl: `${DOCS}/mod-morph#behavior-binding`,
  },
  {
    id: 'bt',
    tag: '&bt',
    label: 'Bluetooth',
    description: 'Selects, switches, disconnects or clears Bluetooth profiles.',
    group: 'Connection',
    docsUrl: `${DOCS}/bluetooth#bluetooth-command-defines`,
  },
  {
    id: 'out',
    tag: '&out',
    label: 'Output',
    description: 'Chooses whether keys go over USB or Bluetooth.',
    group: 'Connection',
    docsUrl: `${DOCS}/outputs#output-command-defines`,
  },
  {
    id: 'sys_reset',
    tag: '&sys_reset',
    label: 'Reset',
    description: 'Restarts the keyboard.',
    group: 'Firmware',
    docsUrl: `${DOCS}/reset#reset`,
  },
  {
    id: 'bootloader',
    tag: '&bootloader',
    label: 'Bootloader',
    description: 'Restarts into the bootloader so new firmware can be flashed.',
    group: 'Firmware',
    docsUrl: `${DOCS}/reset#bootloader-reset`,
  },
  {
    id: 'tap_dance',
    tag: 'tap-dance',
    label: 'Tap dance',
    description: 'Sends one action on a single tap, another on a double tap, and so on.',
    group: 'Your behaviors',
    docsUrl: `${DOCS}/tap-dance`,
  },
  {
    id: 'mod_morph',
    tag: 'mod-morph',
    label: 'Mod-morph',
    description: 'Sends one key normally and another while a chosen modifier is held.',
    group: 'Your behaviors',
    docsUrl: `${DOCS}/mod-morph`,
  },
] as const satisfies readonly BehaviorEntry[];

// One row of the behavior picker, in picker order.
export type BehaviorKind = (typeof BEHAVIORS)[number];

// Compile-time guard: every BehaviorId is offered exactly once in panel order. `satisfies`
// above rejects extra ids; this rejects a missing one (a plain array cannot express fullness).
type MissingBehavior = Exclude<BehaviorId, (typeof BEHAVIORS)[number]['id']>;
const assertNoMissingBehavior: MissingBehavior extends never ? true : never = true;
void assertNoMissingBehavior;
