import type { Project, ValidationIssue } from '@domain';

export function validateConditionalLayers(project: Project): readonly ValidationIssue[] {
  return project.conditionalLayers.flatMap((rule, index) => {
    const errors: string[] = [];
    const inputs = rule.ifLayerIds.map((id) =>
      project.layers.findIndex((layer) => layer.id === id),
    );
    const target = project.layers.findIndex((layer) => layer.id === rule.thenLayerId);
    if (inputs.length < 2 || new Set(rule.ifLayerIds).size !== inputs.length) {
      errors.push('choose at least two distinct input layers.');
    }
    if (target === -1 || inputs.includes(-1)) {
      errors.push('a referenced layer was deleted. Choose existing layers.');
    }
    if (inputs.some((input) => input >= target)) {
      errors.push('place the target layer above every input layer in the layer order.');
    }
    if (
      project.conditionalLayers.some(
        (other) => other.id !== rule.id && other.thenLayerId === rule.thenLayerId,
      )
    ) {
      errors.push('each target layer can have only one conditional rule.');
    }
    if (hasLayerCycle(project, rule.thenLayerId, { ancestors: new Set(), visited: new Set() })) {
      errors.push('remove the circular layer dependency.');
    }
    return errors.map((error): ValidationIssue => ({
      code: 'conditional-layer-invalid',
      path: ['conditionalLayers', index],
      message: `Conditional rule ${rule.id}: ${error}`,
    }));
  });
}
function hasLayerCycle(
  project: Project,
  id: string,
  context: { readonly ancestors: ReadonlySet<string>; readonly visited: Set<string> },
): boolean {
  const { ancestors, visited } = context;
  if (ancestors.has(id)) {
    return true;
  }
  if (visited.has(id)) {
    return false;
  }
  visited.add(id);
  const next = new Set([...ancestors, id]);
  return project.conditionalLayers
    .filter((rule) => rule.thenLayerId === id)
    .some((rule) =>
      rule.ifLayerIds.some((input) => hasLayerCycle(project, input, { ancestors: next, visited })),
    );
}
