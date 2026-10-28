import type { RoutingSettings, WiringProposalSummary, Project } from '@domain';
import type { WiringScope } from './resolve-wiring-scope';

export type PrettifyInput = {
  readonly settings: RoutingSettings;
  readonly scope: WiringScope;
  readonly limits: { readonly minLayoutCell: number; readonly maxLayoutCell: number };
};
export type PrettifyCalculation = {
  readonly project: Project;
  readonly warnings: WiringProposalSummary['warnings'];
};
