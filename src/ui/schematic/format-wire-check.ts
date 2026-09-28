import type { WireCheck } from '../../domain/can-add-wire';

const HINT_BY_CHECK: Record<Exclude<WireCheck, 'ok'>, string> = {
  'no-key-pin': 'A wire must start or end on a key pin.',
  'same-pin': 'A wire cannot run from a pin to the same pin.',
  'missing-reference': 'The key or wire this wire connects to was deleted. Draw it again.',
};

export function formatWireCheck(check: Exclude<WireCheck, 'ok'>): string {
  return HINT_BY_CHECK[check];
}
