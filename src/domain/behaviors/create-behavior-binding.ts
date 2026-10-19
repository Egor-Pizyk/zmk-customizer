import type { BehaviorParameter, Binding, Project } from '@domain';
import { getTargetParameterKind } from './get-target-parameter-kind';

function createParameter(
  kind: BehaviorParameter['kind'],
  input: { readonly project: Project; readonly hold: boolean },
): BehaviorParameter {
  if (kind === 'key') {
    return { kind, key: { keycode: input.hold ? 'LSHIFT' : 'A', modifiers: [] } };
  }
  if (kind === 'layer') {
    return { kind, layerId: input.project.layers[0]?.id ?? 'l0' };
  }
  return { kind: 'dummy' };
}
export function createBehaviorBinding(
  project: Project,
  behaviorId: string,
): Extract<Binding, { kind: 'custom' }> {
  const behavior = project.behaviors.find((entry) => entry.id === behaviorId);
  let parameters: readonly BehaviorParameter[] = [];
  if (behavior?.kind === 'hold-tap') {
    parameters = [
      createParameter(getTargetParameterKind(behavior.holdBehavior), { project, hold: true }),
      createParameter(getTargetParameterKind(behavior.tapBehavior), { project, hold: false }),
    ];
  }
  if (behavior?.kind === 'sticky-key') {
    parameters = [createParameter('key', { project, hold: true })];
  }
  if (behavior?.kind === 'sticky-layer') {
    parameters = [createParameter('layer', { project, hold: false })];
  }
  return { kind: 'custom', behaviorId, parameters };
}
