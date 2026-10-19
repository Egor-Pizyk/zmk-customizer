import { keycodeByName } from '@catalog/bindings';
import { assertNever } from '@domain';
import type { Binding, KeyStroke } from '@domain';
import { MODIFIER_SYMBOLS } from './modifier-labels';

// Exact keycode id, modifier symbols with the id when modified, tap over hold for mixed
// bindings; behaviors without a code stay on the face legend (spec 004 FR-007).
function cornerForBinding(binding: Binding): string | undefined {
  if ('key' in binding) {
    const suffix = { kp: '', sk: '/STK', kt: '/TOG' }[binding.kind];
    return `${cornerStrokeText(binding.key)}${suffix}`;
  }
  switch (binding.kind) {
    case 'mt': {
      return `${cornerStrokeText(binding.tap)}/${cornerStrokeText(binding.hold)}`;
    }
    case 'lt': {
      return cornerStrokeText(binding.tap);
    }
    case 'macro':
    case 'custom':
    case 'bt':
    case 'out':
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'sys_reset':
    case 'bootloader':
    case 'tap_dance':
    case 'mod_morph':
    case 'mo':
    case 'tog':
    case 'to':
    case 'sl': {
      return undefined;
    }
    default: {
      return assertNever(binding);
    }
  }
}

function cornerStrokeText(stroke: KeyStroke): string {
  const id = keycodeByName.get(stroke.keycode)?.name ?? stroke.keycode;
  const prefix = stroke.modifiers.map((modifier) => MODIFIER_SYMBOLS[modifier]).join('');
  return `${prefix}${id}`;
}

// Tiny ZMK code for the keycap corner. Undefined when it adds nothing over the face legend,
// so plain A stays a single glyph while 1 gains its NUMBER_1 code.
export function formatKeycapCorner(
  binding: Binding | undefined,
  faceTap: string | undefined,
): string | undefined {
  if (binding === undefined) {
    return undefined;
  }
  const corner = cornerForBinding(binding);
  return corner === undefined || corner === faceTap ? undefined : corner;
}
