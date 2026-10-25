import type { Project } from '@domain';

export const ONBOARDING_STEPS = [
  'name',
  'layout',
  'controller',
  'diodes',
  'wiring',
  'pins',
  'bindings',
  'problems',
  'firmware',
  'files',
  'discovery-project',
  'discovery-import',
  'discovery-bindings',
  'discovery-hardware',
  'discovery-settings',
  'download',
  'finish',
] as const;
export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];
export type OnboardingRecord = {
  readonly version: 1;
  readonly tutorialRevision: 1;
  readonly project: Project;
  readonly stepId: OnboardingStepId;
  readonly acknowledgedStepIds: readonly OnboardingStepId[];
  readonly outcome: 'in-progress' | 'closed' | 'completed';
};
export type OnboardingFacts = {
  readonly hasValidName: boolean;
  readonly digitKeycodes: readonly (readonly string[])[];
  readonly hasMatrix: boolean;
  readonly hasPins: boolean;
  readonly hasIssues: boolean;
  readonly isBoardSupported: boolean;
};
