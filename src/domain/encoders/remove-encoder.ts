import { getWireProtection, preserveWireProtection } from '@domain/wires/protection';
import { removeOrphanWires } from '@domain/wires';
import { removeKey } from '@domain/keys';
import type { Project, Layer } from '@domain';

function removeEncoderCandidate(project: Project, encoderId: string): Project {
  if (!project.encoders.some((entry) => entry.id === encoderId)) {
    return project;
  }
  const encoder = project.encoders.find((entry) => entry.id === encoderId);
  if (
    encoder?.pushKeyId !== undefined &&
    getWireProtection(project, { keyIds: [encoder.pushKeyId] }).length > 0
  ) {
    return project;
  }
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

export function removeEncoder(
  project: Project,
  input: Parameters<typeof removeEncoderCandidate>[1],
): Project {
  return preserveWireProtection(project, removeEncoderCandidate(project, input));
}
