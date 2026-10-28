import { getWireProtection } from '@domain/wires/protection';
import type { PointerState } from './pointer-types';

export function refuseProtectedEdit(
  state: Pick<PointerState, 'project' | 'onHint'>,
  input: Parameters<typeof getWireProtection>[1],
): boolean {
  const wire = getWireProtection(state.project, input)[0];
  if (wire === undefined) {
    return false;
  }
  const index = state.project.wires.findIndex((entry) => entry.id === wire.wireId);
  state.onHint(`Wire ${index} is locked. Use Find wire in Parts and unlock it before editing.`);
  return true;
}
