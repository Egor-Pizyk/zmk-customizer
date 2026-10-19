import type { Project, Layer } from '@domain';

export function removeEncoder(project: Project, encoderId: string): Project {
  if (!project.encoders.some((encoder) => encoder.id === encoderId)) {
    return project;
  }
  return {
    ...project,
    encoders: project.encoders.filter((encoder) => encoder.id !== encoderId),
    layers: project.layers.map((layer) => removeLayerEncoder(layer, encoderId)),
  };
}

function removeLayerEncoder(layer: Layer, encoderId: string): Layer {
  if (layer.encoderBindings?.[encoderId] === undefined) {
    return layer;
  }
  const remaining = Object.fromEntries(
    Object.entries(layer.encoderBindings).filter(([id]) => id !== encoderId),
  );
  const { encoderBindings: _removed, ...rest } = layer;
  return Object.keys(remaining).length === 0 ? rest : { ...rest, encoderBindings: remaining };
}
