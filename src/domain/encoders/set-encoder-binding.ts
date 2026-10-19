import type { Binding, EncoderBinding, Project } from '@domain';

export function setEncoderBinding(
  project: Project,
  input: {
    readonly layerId: string;
    readonly encoderId: string;
    readonly direction: keyof EncoderBinding;
    readonly binding: Binding;
  },
): Project {
  if (
    !project.encoders.some((encoder) => encoder.id === input.encoderId) ||
    !project.layers.some((layer) => layer.id === input.layerId)
  ) {
    return project;
  }
  return {
    ...project,
    layers: project.layers.map((layer) => {
      if (layer.id !== input.layerId) {
        return layer;
      }
      const previous = layer.encoderBindings?.[input.encoderId] ?? {
        clockwise: { kind: 'none' },
        counterclockwise: { kind: 'none' },
      };
      return {
        ...layer,
        encoderBindings: {
          ...layer.encoderBindings,
          [input.encoderId]: { ...previous, [input.direction]: input.binding },
        },
      };
    }),
  };
}
