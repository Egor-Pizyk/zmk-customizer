import type { Half, KeyPin, Project } from './types';

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

export type WiringProposalFailure = {
  readonly code: 'stale' | 'locked' | 'resources' | 'operation';
  readonly message: string;
  readonly wireIds: readonly string[];
};

export type WiringProposalSummary = {
  readonly wireChanges: {
    readonly retained: readonly string[];
    readonly added: readonly string[];
    readonly changed: readonly string[];
    readonly removed: readonly string[];
  };
  readonly retained: number;
  readonly added: number;
  readonly rerouted: number;
  readonly removed: number;
  readonly keyIds: readonly string[];
  readonly terminalIds: readonly string[];
  readonly protectedWireIds: readonly string[];
  readonly diodeKeyIds: readonly string[];
  readonly settingsChanged: boolean;
  readonly unconnectedPins: readonly { readonly keyId: string; readonly pin: KeyPin }[];
  readonly warnings: readonly {
    readonly message: string;
    readonly wireIds: readonly string[];
    readonly keyIds: readonly string[];
  }[];
};

export type WiringProposalResult =
  | {
      readonly kind: 'changed';
      readonly source: string;
      readonly candidate: Project;
      readonly summary: WiringProposalSummary;
    }
  | { readonly kind: 'no-change'; readonly summary: WiringProposalSummary }
  | { readonly kind: 'refused'; readonly failure: WiringProposalFailure };
