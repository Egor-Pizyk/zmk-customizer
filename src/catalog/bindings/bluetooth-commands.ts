import type { BluetoothCommand, BluetoothProfileCommand } from '@domain';

export type BluetoothCommandEntry = {
  readonly id: BluetoothCommand | BluetoothProfileCommand;
  readonly label: string;
  readonly description: string;
  readonly needsProfile: boolean;
  readonly docsUrl: string;
};

const DOCS_URL =
  'https://v0-3-branch.zmk.dev/docs/keymaps/behaviors/bluetooth#bluetooth-command-defines';

// dt-bindings/zmk/bt.h (docs/zmk/behaviors.md §2).
export const BLUETOOTH_COMMANDS = [
  {
    id: 'BT_SEL',
    label: 'Select profile',
    description: 'Switches to a Bluetooth profile by number.',
    needsProfile: true,
    docsUrl: DOCS_URL,
  },
  {
    id: 'BT_DISC',
    label: 'Disconnect profile',
    description: 'Disconnects a connected, inactive profile by number without forgetting it.',
    needsProfile: true,
    docsUrl: DOCS_URL,
  },
  {
    id: 'BT_NXT',
    label: 'Next profile',
    description: 'Switches to the next Bluetooth profile.',
    needsProfile: false,
    docsUrl: DOCS_URL,
  },
  {
    id: 'BT_PRV',
    label: 'Previous profile',
    description: 'Switches to the previous Bluetooth profile.',
    needsProfile: false,
    docsUrl: DOCS_URL,
  },
  {
    id: 'BT_CLR',
    label: 'Clear current profile',
    description: 'Forgets the device paired to the current profile.',
    needsProfile: false,
    docsUrl: DOCS_URL,
  },
  {
    id: 'BT_CLR_ALL',
    label: 'Clear all profiles',
    description: 'Forgets the devices paired to every profile.',
    needsProfile: false,
    docsUrl: DOCS_URL,
  },
] as const satisfies readonly BluetoothCommandEntry[];

/** ZMK default (CONFIG_BT_MAX_CONN / CONFIG_BT_MAX_PAIRED), profiles 0–4 (docs/zmk/behaviors.md §2). */
export const BLUETOOTH_PROFILE_COUNT = 5;
