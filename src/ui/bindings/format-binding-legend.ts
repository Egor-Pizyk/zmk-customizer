import { KEYCODE_LEGENDS } from '../../catalog/keycode-legends';
import { KEYCODES, keycodeByName } from '../../catalog/keycodes';
import type { Keycode } from '../../catalog/parse-keys-header';
import { assertNever } from '../../domain/assert-never';
import { MODIFIERS } from '../../domain/types';
import type { Binding, KeyStroke, Modifier } from '../../domain/types';
import { abbreviateKeycodeNames } from './abbreviate-keycode';
import { MODIFIER_SYMBOLS } from './modifier-labels';

/**
 * Tap part large in the center with its Shift symbol smaller beside it, as printed on a keycap
 * (`]` and `}`), hold part small at the bottom (spec 004 FR-006).
 */
export type BindingLegend = {
  readonly tap: string;
  readonly shifted?: string;
  readonly hold?: string;
};

const MAX_LEGEND_LENGTH = 7;
const DESCRIPTION_SYMBOL_PATTERN = /^Keyboard (\S) /u;

function toUsageKey(keycode: Keycode): string {
  return `${keycode.usage.page}:${keycode.usage.id}`;
}

// DOLLAR and friends: the key a Shift turns a base key into on a US layout (FR-006a).
const shiftedByUsage: ReadonlyMap<string, Keycode> = new Map(
  KEYCODES.filter((keycode) => keycode.implicitModifiers.includes('LS')).map((keycode) => [
    toUsageKey(keycode),
    keycode,
  ]),
);

const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });

// Counted in graphemes so symbols and emoji count once; a longer legend would overflow (FR-007).
function truncate(text: string): string {
  const graphemes = Array.from(segmenter.segment(text), (part) => part.segment);
  return graphemes.length > MAX_LEGEND_LENGTH
    ? `${graphemes.slice(0, MAX_LEGEND_LENGTH - 1).join('')}…`
    : text;
}

/** Grapheme count, so symbols and emoji count once (legends, tooltips, keycap sizing). */
export function countGraphemes(text: string): number {
  return [...segmenter.segment(text)].length;
}

function formatKeycodeLegend(keycode: Keycode): string {
  const base = baseKeycodeLegend(keycode);
  if (countGraphemes(base) <= MAX_LEGEND_LENGTH) {
    return base;
  }
  return ABBREVIATED_LEGENDS.get(keycode.name) ?? truncate(base);
}

function baseKeycodeLegend(keycode: Keycode): string {
  const legend = KEYCODE_LEGENDS[keycode.name];
  if (legend !== undefined) {
    return legend;
  }
  if (keycode.category === 'letters') {
    return keycode.name;
  }
  const symbol = DESCRIPTION_SYMBOL_PATTERN.exec(keycode.description)?.[1];
  if (symbol !== undefined) {
    return symbol;
  }
  const [shortest] = [keycode.name, ...keycode.aliases].toSorted(
    (first, second) => first.length - second.length,
  );
  return shortest ?? keycode.name;
}

// Abbreviations for every keycode whose derived legend overflows the keycap, computed once:
// the map is the uniqueness guarantee the global legend test checks.
const ABBREVIATED_LEGENDS: ReadonlyMap<string, string> = abbreviateKeycodeNames(
  KEYCODES.filter((keycode) => countGraphemes(baseKeycodeLegend(keycode)) > MAX_LEGEND_LENGTH).map(
    (keycode) => keycode.name,
  ),
);

function formatKeyStrokeLegend(stroke: KeyStroke, isFull: boolean): string {
  const keycode = keycodeByName.get(stroke.keycode);
  if (keycode === undefined) {
    const text = `?${stroke.keycode}`;
    return isFull ? text : truncate(text);
  }
  const effective = new Set<Modifier>([...stroke.modifiers, ...keycode.implicitModifiers]);
  const shifted = shiftedByUsage.get(toUsageKey(keycode));
  const isShifted = shifted !== undefined && (effective.has('LS') || effective.has('RS'));
  if (isShifted) {
    effective.delete(effective.has('LS') ? 'LS' : 'RS');
  }
  const prefix = MODIFIERS.filter((modifier) => effective.has(modifier))
    .map((modifier) => MODIFIER_SYMBOLS[modifier])
    .join('');
  const text = `${prefix}${formatKeycodeLegend(isShifted ? shifted : keycode)}`;
  return isFull ? text : truncate(text);
}

// The symbol Shift gives an unmodified base key on a US layout; none for a key that already
// carries modifiers, so the keycap never shows a symbol the key does not send.
function findShiftedLegend(stroke: KeyStroke): string | undefined {
  const keycode = keycodeByName.get(stroke.keycode);
  if (
    keycode === undefined ||
    stroke.modifiers.length > 0 ||
    keycode.implicitModifiers.length > 0
  ) {
    return undefined;
  }
  const shifted = shiftedByUsage.get(toUsageKey(keycode));
  return shifted === undefined ? undefined : formatKeycodeLegend(shifted);
}

function toStrokeLegend(stroke: KeyStroke, isFull: boolean): BindingLegend {
  const tap = formatKeyStrokeLegend(stroke, isFull);
  const shifted = findShiftedLegend(stroke);
  return shifted === undefined ? { tap } : { tap, shifted };
}

const BLUETOOTH_LEGENDS = {
  BT_SEL: 'BT',
  BT_DISC: 'BT✕',
  BT_NXT: 'BT→',
  BT_PRV: 'BT←',
  BT_CLR: 'BT⌫',
  BT_CLR_ALL: 'BT⌫*',
};
const OUTPUT_LEGENDS = { OUT_TOG: 'OUT', OUT_USB: 'USB', OUT_BLE: 'BLE' };
const FIXED_LEGENDS = {
  trans: '▽',
  none: '✕',
  caps_word: 'CW',
  key_repeat: 'REP',
  gresc: '⎋`',
  sys_reset: 'RST',
  bootloader: 'BOOT',
};

/** The command without its profile, for the picker's command rows (spec 006). */
export function formatBluetoothCommandLegend(
  command: Extract<Binding, { kind: 'bt' }>['command'],
): string {
  return BLUETOOTH_LEGENDS[command];
}

function formatBluetoothLegend(binding: Extract<Binding, { kind: 'bt' }>): string {
  if ('profile' in binding) {
    return binding.command === 'BT_SEL' ? `BT ${binding.profile}` : `BT✕${binding.profile}`;
  }
  return BLUETOOTH_LEGENDS[binding.command];
}

/** One-face legends: no parameters to format (spec 004 FR-006). */
type SimpleBinding = Extract<
  Binding,
  {
    kind: 'trans' | 'none' | 'caps_word' | 'key_repeat' | 'gresc' | 'sys_reset' | 'bootloader';
  }
>;

function isSimpleBinding(binding: Binding): binding is SimpleBinding {
  switch (binding.kind) {
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'sys_reset':
    case 'bootloader': {
      return true;
    }
    case 'kp':
    case 'mt':
    case 'sk':
    case 'kt':
    case 'bt':
    case 'out':
    case 'tap_dance':
    case 'mod_morph': {
      return false;
    }
    default: {
      return assertNever(binding);
    }
  }
}

/** Undefined = unassigned: an empty keycap (FR-006). */
export function formatBindingLegend(binding: Binding | undefined): BindingLegend | undefined {
  return toBindingLegend(binding, false);
}

/** Hover tooltips: the same legend, never shortened with "…" (FR-007). */
export function formatFullBindingLegend(binding: Binding | undefined): BindingLegend | undefined {
  return toBindingLegend(binding, true);
}

function toBindingLegend(binding: Binding | undefined, isFull: boolean): BindingLegend | undefined {
  if (binding === undefined) {
    return undefined;
  }
  if (isSimpleBinding(binding)) {
    return { tap: FIXED_LEGENDS[binding.kind] };
  }
  switch (binding.kind) {
    case 'kp': {
      return toStrokeLegend(binding.key, isFull);
    }
    case 'mt': {
      return {
        ...toStrokeLegend(binding.tap, isFull),
        hold: formatKeyStrokeLegend(binding.hold, isFull),
      };
    }
    case 'sk': {
      return { ...toStrokeLegend(binding.key, isFull), hold: 'STK' };
    }
    case 'kt': {
      return { ...toStrokeLegend(binding.key, isFull), hold: 'TOG' };
    }
    case 'bt': {
      return { tap: formatBluetoothLegend(binding) };
    }
    case 'out': {
      return { tap: OUTPUT_LEGENDS[binding.command] };
    }
    case 'tap_dance': {
      return formatTapDanceLegend(binding, isFull);
    }
    case 'mod_morph': {
      return formatModMorphLegend(binding, isFull);
    }
    default: {
      return assertNever(binding);
    }
  }
}

// The morphed action with its triggers reads like the mod-tap hold part: one glance shows
// both sides (spec 005 data-model.md).
function formatModMorphLegend(
  binding: Extract<Binding, { kind: 'mod_morph' }>,
  isFull: boolean,
): BindingLegend {
  const triggered: KeyStroke = {
    keycode: binding.morphed.keycode,
    modifiers: [...binding.mods, ...binding.morphed.modifiers],
  };
  return {
    tap: formatKeyStrokeLegend(binding.normal, isFull),
    hold: formatKeyStrokeLegend(triggered, isFull),
  };
}
// First tap large in the center; the rest small at the bottom: the second tap when there are
// two, a count beyond that, and a tap-dance mark for a single tap.
function formatTapDanceLegend(
  binding: Extract<Binding, { kind: 'tap_dance' }>,
  isFull: boolean,
): BindingLegend {
  const [first, ...rest] = binding.taps;
  const tap = first === undefined ? '?' : formatKeyStrokeLegend(first, isFull);
  if (rest.length === 0) {
    return { tap, hold: 'TD' };
  }
  if (!isFull && rest.length > 1) {
    return { tap, hold: `+${rest.length}` };
  }
  return { tap, hold: rest.map((stroke) => formatKeyStrokeLegend(stroke, isFull)).join('/') };
}
