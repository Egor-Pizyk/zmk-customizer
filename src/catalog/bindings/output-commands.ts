import type { OutputCommand } from '@domain';

export type OutputCommandEntry = {
  readonly id: OutputCommand;
  readonly label: string;
  readonly description: string;
  readonly docsUrl: string;
};

const DOCS_URL =
  'https://v0-3-branch.zmk.dev/docs/keymaps/behaviors/outputs#output-command-defines';

// dt-bindings/zmk/outputs.h at v0.3.0; OUT_NONE is main only (docs/zmk/behaviors.md §2).
export const OUTPUT_COMMANDS = [
  {
    id: 'OUT_TOG',
    label: 'Toggle',
    description: 'Switches between USB and Bluetooth.',
    docsUrl: DOCS_URL,
  },
  { id: 'OUT_USB', label: 'USB', description: 'Sends keys over USB.', docsUrl: DOCS_URL },
  {
    id: 'OUT_BLE',
    label: 'Bluetooth',
    description: 'Sends keys over Bluetooth.',
    docsUrl: DOCS_URL,
  },
] as const satisfies readonly OutputCommandEntry[];
