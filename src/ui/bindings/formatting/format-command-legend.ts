import type { Binding } from '@domain';

const BLUETOOTH_LEGENDS = {
  BT_SEL: 'BT',
  BT_DISC: 'BT✕',
  BT_NXT: 'BT→',
  BT_PRV: 'BT←',
  BT_CLR: 'BT⌫',
  BT_CLR_ALL: 'BT⌫*',
};
const OUTPUT_LEGENDS = { OUT_TOG: 'OUT', OUT_USB: 'USB', OUT_BLE: 'BLE' };

/** The command without its profile, for the picker's command rows (spec 006). */
export function formatBluetoothCommandLegend(
  command: Extract<Binding, { kind: 'bt' }>['command'],
): string {
  return BLUETOOTH_LEGENDS[command];
}

/** Keycap legend of a Bluetooth or output binding, with its profile when it has one. */
export function formatCommandLegend(binding: Extract<Binding, { kind: 'bt' | 'out' }>): string {
  if (binding.kind === 'out') {
    return OUTPUT_LEGENDS[binding.command];
  }
  if ('profile' in binding) {
    return binding.command === 'BT_SEL' ? `BT ${binding.profile}` : `BT✕${binding.profile}`;
  }
  return BLUETOOTH_LEGENDS[binding.command];
}
