import { getBehaviorLabel } from '@domain/behaviors';
import type { Binding, Project } from '@domain';
import { renderKeyStroke } from './render-key-stroke';

export function renderBehaviorReference(
  binding: Extract<Binding, { kind: 'custom' }>,
  project: Project,
): string {
  const behavior = project.behaviors.find((entry) => entry.id === binding.behaviorId);
  if (behavior === undefined) {
    throw new Error('Validated custom behavior is missing');
  }
  const parameters = binding.parameters.map((parameter) => {
    if (parameter.kind === 'key') {
      return renderKeyStroke(parameter.key);
    }
    if (parameter.kind === 'layer') {
      return String(project.layers.findIndex((layer) => layer.id === parameter.layerId));
    }
    return '0';
  });
  return [`&${getBehaviorLabel(behavior)}`, ...parameters].join(' ');
}
