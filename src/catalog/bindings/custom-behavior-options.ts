import type { CustomBehavior } from '@domain';

const DOCS = 'https://v0-3-branch.zmk.dev/docs/keymaps/behaviors';
export const CUSTOM_BEHAVIOR_TYPES = [
  {
    kind: 'hold-tap',
    label: 'Hold-tap',
    description: 'Choose a different action for holding and tapping.',
    docsUrl: `${DOCS}/hold-tap#custom-hold-tap-configuration`,
  },
  {
    kind: 'tap-dance',
    label: 'Tap-dance',
    description: 'Choose an action by the number of taps.',
    docsUrl: `${DOCS}/tap-dance`,
  },
  {
    kind: 'mod-morph',
    label: 'Mod-morph',
    description: 'Change the action while a trigger modifier is held.',
    docsUrl: `${DOCS}/mod-morph`,
  },
  {
    kind: 'sticky-key',
    label: 'Sticky key',
    description: 'Keep a key active for the next keypress.',
    docsUrl: `${DOCS}/sticky-key#configuration`,
  },
  {
    kind: 'sticky-layer',
    label: 'Sticky layer',
    description: 'Keep a layer active for the next keypress.',
    docsUrl: `${DOCS}/sticky-layer#configuration`,
  },
] as const satisfies readonly {
  readonly kind: CustomBehavior['kind'];
  readonly label: string;
  readonly description: string;
  readonly docsUrl: string;
}[];
export const HOLD_TAP_TARGETS = [
  'kp',
  'sk',
  'kt',
  'mo',
  'tog',
  'to',
  'sl',
  'none',
  'trans',
  'caps_word',
  'key_repeat',
  'gresc',
  'sys_reset',
  'bootloader',
] as const;
export const HOLD_TAP_FLAVORS = [
  'hold-preferred',
  'balanced',
  'tap-preferred',
  'tap-unless-interrupted',
] as const;
export const CUSTOM_BEHAVIOR_PROPERTIES = {
  holdBehavior: {
    label: 'Hold behavior',
    description: 'Action receiving the first assignment parameter.',
    docsUrl: `${DOCS}/hold-tap#custom-hold-tap-configuration`,
  },
  tapBehavior: {
    label: 'Tap behavior',
    description: 'Action receiving the second assignment parameter.',
    docsUrl: `${DOCS}/hold-tap#custom-hold-tap-configuration`,
  },
  flavor: {
    label: 'Decision rule',
    description: 'How other key presses decide between hold and tap.',
    docsUrl: `${DOCS}/hold-tap#interrupt-flavors`,
  },
  tappingTermMs: {
    label: 'Tapping term (ms)',
    description: 'Time window for deciding a tap.',
    docsUrl: `${DOCS}/hold-tap#tapping-term-ms`,
  },
  quickTapMs: {
    label: 'Quick tap (ms)',
    description: 'Repeat a tap within this interval; -1 disables it.',
    docsUrl: `${DOCS}/hold-tap#quick-tap-ms`,
  },
  requirePriorIdleMs: {
    label: 'Prior idle (ms)',
    description: 'Prefer tap after recent typing; -1 disables it.',
    docsUrl: `${DOCS}/hold-tap#require-prior-idle-ms`,
  },
  retroTap: {
    label: 'Retro tap',
    description: 'Tap on release if no other key was pressed.',
    docsUrl: `${DOCS}/hold-tap#retro-tap`,
  },
  holdWhileUndecided: {
    label: 'Hold while undecided',
    description: 'Press the hold action before the decision.',
    docsUrl: `${DOCS}/hold-tap#hold-while-undecided`,
  },
  holdWhileUndecidedLinger: {
    label: 'Linger while undecided',
    description: 'Keep hold active until the tap is released.',
    docsUrl: `${DOCS}/hold-tap#hold-while-undecided-linger`,
  },
  triggerKeyIds: {
    label: 'Hold trigger keys',
    description:
      'Only these other key positions trigger hold; an empty list disables the position filter.',
    docsUrl: `${DOCS}/hold-tap#positional-hold-tap-and-hold-trigger-key-positions`,
  },
  holdTriggerOnRelease: {
    label: 'Trigger on release',
    description: 'Evaluate positional triggers when the other key is released.',
    docsUrl: `${DOCS}/hold-tap#hold-trigger-on-release`,
  },
  bindings: {
    label: 'Tap actions',
    description: 'Actions in tap-count order.',
    docsUrl: `${DOCS}/tap-dance`,
  },
  normal: {
    label: 'Normal action',
    description: 'Action without a trigger modifier.',
    docsUrl: `${DOCS}/mod-morph`,
  },
  morphed: {
    label: 'Morphed action',
    description: 'Action while any trigger modifier is held.',
    docsUrl: `${DOCS}/mod-morph`,
  },
  mods: {
    label: 'Trigger modifiers',
    description: 'Any selected modifier triggers the alternate action.',
    docsUrl: `${DOCS}/mod-morph`,
  },
  keepMods: {
    label: 'Retained modifiers',
    description: 'Trigger modifiers still sent with the alternate action.',
    docsUrl: `${DOCS}/mod-morph#keep-mods`,
  },
  releaseAfterMs: {
    label: 'Release timeout (ms)',
    description: 'Release an unused sticky action after this interval.',
    docsUrl: `${DOCS}/sticky-key#configuration`,
  },
  quickRelease: {
    label: 'Quick release',
    description: 'Release after the next key is pressed, rather than released.',
    docsUrl: `${DOCS}/sticky-key#configuration`,
  },
  lazy: {
    label: 'Lazy',
    description: 'Delay the sticky press until the next key.',
    docsUrl: `${DOCS}/sticky-key#configuration`,
  },
  ignoreModifiers: {
    label: 'Ignore modifiers',
    description: 'Modifier keys do not release the sticky action.',
    docsUrl: `${DOCS}/sticky-key#configuration`,
  },
} as const;
