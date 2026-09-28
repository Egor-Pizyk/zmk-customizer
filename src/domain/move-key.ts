import { pruneInsulatedCrossings } from './prune-insulated-crossings';
import type { Project, WirePoint } from './types';

export function moveKey(
  project: Project,
  input: { readonly keyId: string; readonly position: WirePoint },
): Project {
  const keys = project.keys.map((key) =>
    key.id === input.keyId ? { ...key, xU: input.position.xU, yU: input.position.yU } : key,
  );
  return pruneInsulatedCrossings({ ...project, keys });
}
