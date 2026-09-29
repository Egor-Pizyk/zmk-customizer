import type { Project } from '../../domain/types';
import { focusKeycap } from './focus-keycap';

// Automatic next key (spec 004 FR-014a): one selected key moves to the next key index; focus
// follows only when it was on the canvas, so repeated clicks in the picker keep working.
export function advanceSelection(input: {
  readonly project: Project;
  readonly selectedKeyIds: readonly string[];
  readonly isEnabled: boolean;
  readonly onSelect: (keyId: string) => void;
}) {
  const { project, selectedKeyIds } = input;
  const index = project.keys.findIndex((key) => key.id === selectedKeyIds[0]);
  const next = project.keys[index + 1];
  if (!input.isEnabled || selectedKeyIds.length !== 1 || index === -1 || next === undefined) {
    return;
  }
  input.onSelect(next.id);
  if (document.activeElement?.closest('[data-canvas-workspace="bindings"]') !== null) {
    focusKeycap(next.id);
  }
}
