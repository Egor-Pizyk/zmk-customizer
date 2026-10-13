import { BINDING_POLICY } from './binding-policy';

export function isValidTappingTerm(tappingTermMs: number): boolean {
  return (
    Number.isInteger(tappingTermMs) &&
    tappingTermMs >= BINDING_POLICY.minPauseMs &&
    tappingTermMs <= BINDING_POLICY.maxPauseMs
  );
}
