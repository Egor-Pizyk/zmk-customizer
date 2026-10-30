import { refuseProtectedEdit } from './refuse-protected-edit';
import { removeEncoder } from '@domain/encoders';
import { removeKey, removeKeysAndSections } from '@domain/keys';
import { removeWire } from '@domain/wires/editing';
import { getWireSections } from '@domain/wires';
import { focusKeyLater, focusCanvasLater } from './focus-schematic';
import type { ShortcutHandlerInput } from './schematic-shortcut-handlers';

export function deleteSelection(input: ShortcutHandlerInput) {
  const { project, commit, selection, onSelectionChange } = input;
  if (selection?.kind === 'encoder') {
    deleteEncoderSelection(input);
    return;
  }
  if (selection?.kind === 'sections') {
    deleteSectionSelection(input);
    return;
  }
  if (selection?.kind === 'key') {
    deleteKeySelection(input);
    return;
  }
  if (selection?.kind === 'multi') {
    deleteMultiSelection(input);
    return;
  }
  if (selection === undefined) {
    return;
  }
  if (
    refuseProtectedEdit(
      { project, onHint: (text) => input.announce?.(text) },
      { wireIds: [selection.wireId], includeAttachments: true },
    )
  ) {
    return;
  }
  const wireIndex = project.wires.findIndex((wire) => wire.id === selection.wireId);
  commit(
    (current) => removeWire(current, { wireId: selection.wireId }),
    `Deleted wire ${wireIndex}`,
  );
  onSelectionChange();
}

function deleteSectionSelection(input: ShortcutHandlerInput) {
  const { project, commit, selection, onSelectionChange } = input;
  if (selection?.kind === 'sections') {
    if (selection.base !== project) {
      onSelectionChange();
      return;
    }
    const result = removeKeysAndSections(project, {
      base: project,
      sectionIds: selection.sectionIds,
      keyIds: selection.keyIds ?? [],
    });
    if (result.ok) {
      commit(
        (current) => (current === project ? result.value : current),
        `Deleted ${selection.keyIds?.length ?? 0} keys and ${selection.sectionIds.length} wire sections. Undo`,
      );
    }
    if (!result.ok) {
      input.announce?.(result.error);
      return;
    }
    onSelectionChange();
    focusCanvasLater();
  }
}

function deleteMultiSelection(input: ShortcutHandlerInput) {
  const { project, commit, selection, onSelectionChange } = input;
  if (selection?.kind !== 'multi') {
    return;
  }
  const result = removeKeysAndSections(project, {
    base: project,
    keyIds: selection.keyIds,
    sectionIds: getWireSections(project)
      .filter((section) => selection.wireIds.includes(section.wireId))
      .map((section) => section.id),
  });
  if (!result.ok) {
    input.announce?.(result.error);
    return;
  }
  commit((current) => (current === project ? result.value : current));
  onSelectionChange();
  focusCanvasLater();
}

function deleteEncoderSelection(input: ShortcutHandlerInput) {
  const { project, commit, selection, onSelectionChange } = input;
  if (selection?.kind === 'encoder') {
    if (
      refuseProtectedEdit(
        { project, onHint: (text) => input.announce?.(text) },
        { encoderIds: [selection.encoderId] },
      )
    ) {
      return;
    }
    commit(
      (current) => removeEncoder(current, selection.encoderId),
      'Deleted encoder. Undo to restore.',
    );
    onSelectionChange();
    focusCanvasLater();
  }
}

function deleteKeySelection(input: ShortcutHandlerInput) {
  const { project, commit, selection, onSelectionChange } = input;
  if (selection?.kind === 'key') {
    if (
      refuseProtectedEdit(
        { project, onHint: (text) => input.announce?.(text) },
        { keyIds: [selection.keyId] },
      )
    ) {
      return;
    }
    const keyIndex = project.keys.findIndex((key) => key.id === selection.keyId);
    commit((current) => removeKey(current, { keyId: selection.keyId }), `Deleted key ${keyIndex}`);
    // Focus is never lost: the next key by index, else the previous one (accessibility.md).
    const nextKey = project.keys[keyIndex + 1] ?? project.keys[keyIndex - 1];
    onSelectionChange(nextKey === undefined ? undefined : { kind: 'key', keyId: nextKey.id });
    if (nextKey === undefined) {
      focusCanvasLater();
    } else {
      focusKeyLater(nextKey.id);
    }
  }
}
