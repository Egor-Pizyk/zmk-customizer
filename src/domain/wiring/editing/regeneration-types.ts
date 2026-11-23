import type {
  ControllerBoard,
  Project,
  RoutingSettings,
  RoutingTargetCell,
  WiringProposalSummary,
} from '@domain';
import type { WiringScope } from './resolve-wiring-scope';

export type WiringRegenerationInput = {
  readonly board: ControllerBoard;
  readonly limits: { readonly minLayoutCell: number; readonly maxLayoutCell: number };
  readonly settings: RoutingSettings;
  readonly scope: WiringScope;
  readonly cells?: readonly RoutingTargetCell[];
};
export type WiringRegeneration = {
  readonly project: Project;
  readonly warnings: WiringProposalSummary['warnings'];
};
