import { findBinding, isSameBinding } from '@domain/bindings';
import { setBindings } from '@domain/bindings/editing';
import type { Binding, Project } from '@domain';
import { useProject } from '@ui/project/logic';
import { formatBindingName } from '@ui/bindings/formatting';
import { useState } from 'react';

type CopiedBindingOptions = {
  /** The open layer and the selected keys (spec 007 FR-007). */
  readonly target: { readonly layerIndex: number; readonly keyIds: readonly string[] };
  readonly selectionName: string;
};

// Session-only clipboard for one action (spec 004 FR-018, R12); never project data.
export function useCopiedBinding(options: CopiedBindingOptions) {
  const { project, commit, announce } = useProject();
  const { selectionName } = options;
  const { layerIndex, keyIds: selectedKeyIds } = options.target;
  const [copiedBinding, setCopiedBinding] = useState<Binding | undefined>();

  function handleCopy() {
    const [keyId] = selectedKeyIds;
    if (selectedKeyIds.length !== 1 || keyId === undefined) {
      return;
    }
    // An unassigned key does nothing, so copying it copies "Do nothing".
    const binding = findBinding(project, { layerIndex, keyId }) ?? { kind: 'none' };
    setCopiedBinding(binding);
    announce(`Copied ${formatCopiedBinding(binding, project)}`);
  }

  function handlePaste() {
    if (copiedBinding === undefined || selectedKeyIds.length === 0) {
      return;
    }
    // Unassigned (missing entry) renders as an empty keycap while `none` renders as ✕,
    // but both do nothing (FR-021): pasting "Do nothing" onto an empty key is a no-op.
    const targetKeyIds = selectedKeyIds.filter((keyId) => {
      const current = findBinding(project, { layerIndex, keyId });
      return (
        !isSameBinding(current, copiedBinding) &&
        !(current === undefined && copiedBinding.kind === 'none')
      );
    });
    if (targetKeyIds.length === 0) {
      return;
    }
    const change = { layerIndex, keyIds: targetKeyIds, binding: copiedBinding };
    const name = formatCopiedBinding(copiedBinding, project);
    const text = `Pasted ${name} to ${selectionName}`;
    commit((current) => setBindings(current, change), text);
  }

  return {
    canPaste: copiedBinding !== undefined,
    ...getReservedCopiedIds(copiedBinding),
    handleCopy,
    handlePaste,
  };
}

function getReservedCopiedIds(copiedBinding: Binding | undefined) {
  const reservedLayerIds =
    copiedBinding?.kind === 'custom'
      ? copiedBinding.parameters.flatMap((parameter) =>
          parameter.kind === 'layer' ? [parameter.layerId] : [],
        )
      : [];
  const directLayerIds =
    copiedBinding !== undefined && 'layerId' in copiedBinding ? [copiedBinding.layerId] : [];
  const reservedBehaviorIds = copiedBinding?.kind === 'custom' ? [copiedBinding.behaviorId] : [];
  return {
    reservedMacroIds: copiedBinding?.kind === 'macro' ? [copiedBinding.macroId] : [],
    reservedLayerIds: [...reservedLayerIds, ...directLayerIds],
    reservedBehaviorIds,
  };
}

function formatCopiedBinding(binding: Binding, project: Project): string {
  return formatBindingName(binding, project.layers, project);
}
