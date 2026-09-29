import { keycodeByName } from '../../catalog/keycodes';
import { assertNever } from '../../domain/assert-never';
import type { Binding, KeyStroke } from '../../domain/types';
import { MODIFIER_SYMBOLS } from './modifier-labels';

// Exact keycode id, modifier symbols with the id when modified, tap over hold for mixed
// bindings; behaviors without a code stay on the face legend (spec 004 FR-007).
function cornerForBinding(binding: Binding): string | undefined {
  switch (binding.kind) {
    case 'kp': {
      return cornerStrokeText(binding.key);
    }
    case 'mt': {
      return `${cornerStrokeText(binding.tap)}/${cornerStrokeText(binding.hold)}`;
    }
    case 'sk': {
      return `${cornerStrokeText(binding.key)}/STK`;
    }
    case 'kt': {
      return `${cornerStrokeText(binding.key)}/TOG`;
    }
    case 'bt':
    case 'out':
    case 'trans':
    case 'none':
    case 'caps_word':
    case 'key_repeat':
    case 'gresc':
    case 'sys_reset':
    case 'bootloader': {
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
