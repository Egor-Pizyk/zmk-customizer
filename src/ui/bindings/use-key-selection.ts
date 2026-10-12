import { useState } from 'react';
import type { Project } from '../../domain/types';

// The selected keys and the roving tab stop, shared by canvas, table and panel (react.md).
export function useKeySelection(project: Project) {
  const [selection, setSelection] = useState<readonly string[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<string | undefined>();
  const hasKey = (keyId: string | undefined) => project.keys.some((key) => key.id === keyId);
  return {
    // Keys deleted in Schematic drop out of the selection (spec 004 edge cases), derived in render.
    selectedKeyIds: selection.filter((keyId) => hasKey(keyId)),
    // The roving tab stop: the last focused key if it still exists, else key 0.
    activeKeyId: hasKey(activeKeyId) ? activeKeyId : project.keys[0]?.id,
    setSelection,
    setActiveKeyId,
  };
}
