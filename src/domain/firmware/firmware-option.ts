export type FirmwareValue = boolean | number | string;

type FirmwareMetadata = {
  readonly id: string;
  readonly label: string;
  readonly category: string;
  readonly description: string;
  readonly docsUrl: string;
  readonly availability?: 'ble' | 'split';
  readonly centralOnly?: boolean;
  readonly requires?: readonly {
    readonly id: string;
    readonly value: FirmwareValue;
    readonly label: string;
  }[];
};

export type FirmwareOption = FirmwareMetadata &
  (
    | {
        readonly kind: 'bool';
        readonly default: boolean;
        readonly boardDefault?: 'ble';
        readonly defaultRequires?: string;
      }
    | {
        readonly kind: 'int';
        readonly default: number;
        readonly min: number;
        readonly max: number;
        readonly unit: string;
      }
    | {
        readonly kind: 'enum';
        readonly default: string;
        readonly choices: readonly {
          readonly value: string;
          readonly label: string;
          readonly symbol: string;
        }[];
      }
    | { readonly kind: 'string'; readonly default: string; readonly maxBytes: number }
  );
