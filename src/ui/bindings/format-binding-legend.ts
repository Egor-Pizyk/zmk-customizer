import { KEYCODE_LEGENDS } from '../../catalog/keycode-legends';
import { KEYCODES, keycodeByName } from '../../catalog/keycodes';
import type { Keycode } from '../../catalog/parse-keys-header';
import { assertNever } from '../../domain/assert-never';
import { MODIFIERS } from '../../domain/types';
import type { Binding, KeyStroke, Modifier } from '../../domain/types';
import { abbreviateKeycodeNames } from './abbreviate-keycode';
import { MODIFIER_SYMBOLS } from './modifier-labels';

/** Tap part large in the center, hold part small at the bottom (spec 004 FR-006). */
export type BindingLegend = { readonly tap: string; readonly hold?: string };

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

const BLUETOOTH_LEGENDS = { BT_NXT: 'BT→', BT_PRV: 'BT←', BT_CLR: 'BT⌫', BT_CLR_ALL: 'BT⌫*' };
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

function formatBluetoothLegend(binding: Extract<Binding, { kind: 'bt' }>): string {
  if ('profile' in binding) {
    return binding.command === 'BT_SEL' ? `BT ${binding.profile}` : `BT✕${binding.profile}`;
  }
  return BLUETOOTH_LEGENDS[binding.command];
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
  switch (binding.kind) {
    case 'kp': {
      return { tap: formatKeyStrokeLegend(binding.key, isFull) };
    }
    case 'mt': {
      return {
        tap: formatKeyStrokeLegend(binding.tap, isFull),
        hold: formatKeyStrokeLegend(binding.hold, isFull),
      };
    }
    case 'sk': {
      return { tap: formatKeyStrokeLegend(binding.key, isFull), hold: 'STK' };
    }
    case 'kt': {
      return { tap: formatKeyStrokeLegend(binding.key, isFull), hold: 'TOG' };
    }
    case 'bt': {
      return { tap: formatBluetoothLegend(binding) };
    }
    case 'out': {
      return { tap: OUTPUT_LEGENDS[binding.command] };
    }
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'sys_reset':
    case 'bootloader': {
      return { tap: FIXED_LEGENDS[binding.kind] };
    }
    default: {
      return assertNever(binding);
    }
  }
}
