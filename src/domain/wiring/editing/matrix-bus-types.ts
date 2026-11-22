import type { Half, Key, KeyPin, WirePoint } from '@domain';

export type MatrixBusBranch = {
  readonly keyId: string;
  readonly pin: KeyPin;
  readonly pinAt: WirePoint;
  readonly busAt: WirePoint;
  readonly requiresDetour: boolean;
};
export type MatrixBusRoute = {
  readonly terminalId: string;
  readonly half: Half;
  readonly kind: 'row' | 'col';
  readonly index: number;
  readonly line: readonly [WirePoint, WirePoint];
  readonly branches: readonly MatrixBusBranch[];
};
export type MatrixBusMember = { readonly key: Key; readonly pin: KeyPin; readonly at: WirePoint };
export type MatrixBusGroup = Pick<MatrixBusRoute, 'terminalId' | 'half' | 'kind' | 'index'> & {
  readonly members: readonly MatrixBusMember[];
};
