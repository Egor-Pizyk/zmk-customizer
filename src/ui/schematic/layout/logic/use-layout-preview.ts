import { editLayout } from '@domain/keys';
import type { LayoutEdit } from '@domain/keys';
import type { Project } from '@domain';
import { getSelectedKeyIds } from '@ui/schematic/interaction';
import type { Commit, SchematicSelection } from '@ui/schematic/interaction';
import { useState } from 'react';

type Preview = { readonly base: Project; readonly selectionKey: string; readonly edit: LayoutEdit };

export function useLayoutPreview(project: Project, selection: SchematicSelection, commit: Commit) {
  const selectionKey = getSelectedKeyIds(selection, { project }).join(',');
  const [preview, setPreview] = useState<Preview | undefined>();
  const current =
    preview?.base === project && preview.selectionKey === selectionKey ? preview : undefined;
  // Discard an invalidated draft, so undo back to its old base cannot resurrect it.
  if (preview !== undefined && current === undefined) {
    setPreview(undefined);
  }
  const previewProject = current === undefined ? project : editLayout(project, current.edit);
  return {
    canApply: previewProject !== project,
    hasPreview: current !== undefined,
    previewProject,
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
