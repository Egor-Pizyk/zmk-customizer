export const WIRING_OPTIONS = {
  modes: [
    {
      id: 'matrix',
      label: 'Matrix',
      description: 'Rows and columns with one diode per switch.',
      docsUrl: 'https://v0-3-branch.zmk.dev/docs/config/kscan#matrix-driver',
    },
    {
      id: 'direct',
      label: 'Direct',
      description: 'One input GPIO per switch, with the other contact connected to GND.',
      docsUrl: 'https://v0-3-branch.zmk.dev/docs/config/kscan#direct-gpio-driver',
    },
  ],
  topologies: [
    {
      id: 'unibody',
      label: 'Unibody',
      description: 'One controller reads the whole keyboard.',
      docsUrl: 'https://v0-3-branch.zmk.dev/docs/config/kscan',
    },
    {
      id: 'split',
      label: 'BLE split',
      description: 'Left central and right peripheral, using the same Bluetooth board.',
      docsUrl: 'https://v0-3-branch.zmk.dev/docs/config/split',
    },
  ],
  directions: [
    {
      id: 'col2row',
      label: 'Column to row',
      description: 'Current flows from column to row; the cathode is on the row.',
      docsUrl: 'https://v0-3-branch.zmk.dev/docs/config/kscan#matrix-driver',
    },
    {
      id: 'row2col',
      label: 'Row to column',
      description: 'Current flows from row to column; the cathode is on the column.',
      docsUrl: 'https://v0-3-branch.zmk.dev/docs/config/kscan#matrix-driver',
    },
  ],
} as const;
