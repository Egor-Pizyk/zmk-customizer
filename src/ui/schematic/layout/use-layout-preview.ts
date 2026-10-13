import { useState } from 'react';
import { editLayout } from '@domain';
import type { LayoutEdit, Project } from '@domain';
import { getSelectedKeyIds } from '../interaction/get-selected-key-ids';
import type { Commit } from '../interaction/pointer-types';
import type { SchematicSelection } from '../interaction/schematic-selection';

type Preview = { readonly base: Project; readonly selectionKey: string; readonly edit: LayoutEdit };

export function useLayoutPreview(project: Project, selection: SchematicSelection, commit: Commit) {
  const selectionKey = getSelectedKeyIds(selection).join(',');
  const [preview, setPreview] = useState<Preview | undefined>();
  const current =
    preview?.base === project && preview.selectionKey === selectionKey ? preview : undefined;
  // Discard an invalidated draft, so undo back to its old base cannot resurrect it.
  if (preview !== undefined && current === undefined) {
    setPreview(undefined);
  }
  return {
    hasPreview: current !== undefined,
    previewProject: current === undefined ? project : editLayout(project, current.edit),
    handlePreview: (edit: LayoutEdit) => {
      setPreview({ base: project, selectionKey, edit });
    },
    handleApply: () => {
      if (current !== undefined) {
        commit((base) => editLayout(base, current.edit), 'Edited selected layout');
      }
      setPreview(undefined);
    },
    handleCancel: () => {
      setPreview(undefined);
    },
  };
}
