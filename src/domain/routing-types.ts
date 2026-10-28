import type { Half, KeyPin } from './types';

export type RoutingTargetCell = {
  readonly keyId: string;
  readonly half: Half;
  readonly row: number;
  readonly col: number;
};

export type RoutingSettings = {
  readonly matrixStyle: 'existing' | 'symmetric-bus';
  readonly offsetU: number;
  readonly clearanceU: number;
  readonly fallbackRowIntervalU: number;
  readonly mirrorAxisXU?: number;
  readonly preferredScope: 'all' | 'half' | 'selection';
  readonly preferredHalf?: Half;
  readonly rowPin?: KeyPin;
  readonly diodeSide?: 'row' | 'col';
  readonly targetCells?: readonly RoutingTargetCell[];
};
