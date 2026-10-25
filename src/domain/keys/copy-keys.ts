import type { Key, Layer, Project } from '@domain';

export type KeyClipboard = {
  readonly keys: readonly Key[];
  readonly layers: readonly Pick<Layer, 'id' | 'bindings'>[];
};

export function copyKeys(
  project: Project,
  input: { readonly keyIds: readonly string[] },
): KeyClipboard {
  const keys = project.keys.filter(
    (key) =>
      input.keyIds.includes(key.id) &&
      !project.encoders.some((encoder) => encoder.pushKeyId === key.id),
  );
  return {
    keys,
    layers: project.layers.map((layer) => ({
      id: layer.id,
      bindings: Object.fromEntries(
        Object.entries(layer.bindings).filter(([keyId]) => keys.some((key) => key.id === keyId)),
      ),
    })),
  };
}
