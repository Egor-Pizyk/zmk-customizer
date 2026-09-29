import { useState } from 'react';
import { findBinding } from '../../domain/find-binding';
import { isSameBinding } from '../../domain/is-same-binding';
import { setBindings } from '../../domain/set-bindings';
import type { Binding, Project } from '../../domain/types';
import { formatBindingName } from './format-binding-name';

type CopiedBindingOptions = {
  readonly project: Project;
  readonly selectedKeyIds: readonly string[];
  readonly selectionName: string;
  readonly commit: (change: (project: Project) => Project, announcementText?: string) => void;
  readonly announce: (text: string) => void;
};

// Session-only clipboard for one action (spec 004 FR-018, R12); never project data.
export function useCopiedBinding(options: CopiedBindingOptions) {
  const { project, selectedKeyIds, selectionName, commit, announce } = options;
  const [copiedBinding, setCopiedBinding] = useState<Binding | undefined>();

  function handleCopy() {
    const [keyId] = selectedKeyIds;
    if (selectedKeyIds.length !== 1 || keyId === undefined) {
      return;
    }
    // An unassigned key does nothing, so copying it copies "Do nothing".
    const binding = findBinding(project, { layerIndex: 0, keyId }) ?? { kind: 'none' };
    setCopiedBinding(binding);
    announce(`Copied ${formatBindingName(binding)}`);
  }

  function handlePaste() {
    if (copiedBinding === undefined || selectedKeyIds.length === 0) {
      return;
    }
    // Unassigned (missing entry) renders as an empty keycap while `none` renders as ✕,
    // but both do nothing (FR-021): pasting "Do nothing" onto an empty key is a no-op.
    const targetKeyIds = selectedKeyIds.filter((keyId) => {
      const current = findBinding(project, { layerIndex: 0, keyId });
      return (
        !isSameBinding(current, copiedBinding) &&
        !(current === undefined && copiedBinding.kind === 'none')
      );
    });
    if (targetKeyIds.length === 0) {
      return;
    }
    const change = { layerIndex: 0, keyIds: targetKeyIds, binding: copiedBinding };
    const text = `Pasted ${formatBindingName(copiedBinding)} to ${selectionName}`;
    commit((current) => setBindings(current, change), text);
  }

  return { canPaste: copiedBinding !== undefined, handleCopy, handlePaste };
}
