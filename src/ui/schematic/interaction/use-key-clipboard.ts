import { useState } from 'react';
import { copyKeys, pasteKeys } from '@domain/keys';
import type { KeyClipboard } from '@domain/keys';
import { PROJECT_BUDGET } from '@storage/project';
import { useProject } from '@ui/project/logic';
import { getSelectedKeyIds } from './get-selected-key-ids';
import { focusKeyLater } from './schematic-shortcut-handlers';
import type { SchematicSelection, SelectionChange } from './schematic-selection';

type ClipboardInput = {
  readonly selection: SchematicSelection;
  readonly onSelectionChange: SelectionChange;
  readonly hasDraft: boolean;
};
type Snapshot = { readonly request: number; readonly clipboard: KeyClipboard };

export function useKeyClipboard(input: ClipboardInput) {
  const context = useProject();
  const { project, announce, importSession } = context;
  const [snapshot, setSnapshot] = useState<Snapshot>();
  function handleCopy() {
    const clipboard = copyKeys(project, {
      keyIds: getSelectedKeyIds(input.selection, { project }),
    });
    setSnapshot({ request: importSession.getRequest(), clipboard });
    announce(
      clipboard.keys.length === 0
        ? 'Select ordinary keys to copy. Encoders are not copied.'
        : `Copied ${clipboard.keys.length} keys with actions from all layers, without wires.`,
    );
  }
  return {
    onCopy: handleCopy,
    onPaste: () => {
      pasteSnapshot(context, input, snapshot);
    },
  };
}

function pasteSnapshot(
  context: ReturnType<typeof useProject>,
  input: ClipboardInput,
  snapshot: Snapshot | undefined,
) {
  const { project, commit, announce, importSession } = context;
  if (input.hasDraft) {
    announce('Apply or cancel the preview before pasting keys.');
    return;
  }
  if (
    snapshot === undefined ||
    snapshot.request !== importSession.getRequest() ||
    snapshot.clipboard.keys.length === 0
  ) {
    announce('Copy ordinary keys in Schematic before pasting.');
    return;
  }
  const next = pasteKeys(project, {
    clipboard: snapshot.clipboard,
    maxKeyCount: PROJECT_BUDGET.keys,
  });
  if (next === project) {
    announce(
      `A project can contain at most ${PROJECT_BUDGET.keys} keys. Delete keys before pasting.`,
    );
    return;
  }
  commit(
    (current) => (current === project ? next : current),
    `Pasted ${snapshot.clipboard.keys.length} keys without wires`,
  );
  const keyIds = next.keys.slice(project.keys.length).map((key) => key.id);
  input.onSelectionChange({ kind: 'multi', keyIds, wireIds: [] });
  const firstId = keyIds[0];
  if (firstId !== undefined) {
    focusKeyLater(firstId);
  }
}
