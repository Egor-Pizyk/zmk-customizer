import { removeKey } from '@domain/keys';
import { removeOrphanWires } from '@domain/wires';
import type { Project, Layer } from '@domain';

export function removeEncoder(project: Project, encoderId: string): Project {
  if (!project.encoders.some((entry) => entry.id === encoderId)) {
    return project;
  }
  const encoder = project.encoders.find((entry) => entry.id === encoderId);
  const withoutButton =
    encoder?.pushKeyId === undefined ? project : removeKey(project, { keyId: encoder.pushKeyId });
  const removedWireIds = project.wires
    .filter((wire) =>
      [wire.start, wire.end].some(
        (end) => end.kind === 'encoder-pin' && end.encoderId === encoderId,
      ),
    )
    .map((wire) => wire.id);
  const cleaned = removeOrphanWires(withoutButton, { removedWireIds });
  return {
    ...cleaned,
    encoders: project.encoders.filter((entry) => entry.id !== encoderId),
    layers: cleaned.layers.map((layer) => removeLayerEncoder(layer, encoderId)),
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
