import type { LayoutEdit } from '@domain/keys';
import type { Key, Project } from '@domain';
import { getSelectedKeyIds } from '@ui/schematic/interaction';
import { LayoutActions } from './layout-actions';
import { LayoutFields } from './layout-fields';
import type { PartsTableProps } from '@ui/schematic/parts/components';
import { useState } from 'react';

type LayoutControlsProps = PartsTableProps & {
  readonly hasPreview: boolean;
  readonly canApply: boolean;
  readonly onPreview: (edit: LayoutEdit) => void;
  readonly onApply: () => void;
  readonly onCancel: () => void;
};
type Draft = { readonly base: Project; readonly selectionKey: string; readonly edit: LayoutEdit };

export function LayoutControls(props: LayoutControlsProps) {
  const { project, selection } = props;
  const keyIds = getSelectedKeyIds(selection, { project }).filter((id) =>
    project.keys.some((key) => key.id === id),
  );
  const selectionKey = keyIds.join(',');
  const [draft, setDraft] = useState<Draft | undefined>();
  const current =
    props.hasPreview && draft?.base === project && draft.selectionKey === selectionKey
      ? draft
      : undefined;
  if (draft !== undefined && current === undefined) {
    setDraft(undefined);
  }
  const edit = current?.edit ?? { keyIds, geometry: {}, offset: { xU: 0, yU: 0 } };
  const first = project.keys.find((key) => key.id === keyIds[0]);
  function handleEditChange(next: LayoutEdit) {
    props.onPreview(next);
    setDraft({ base: project, selectionKey, edit: next });
  }
  return (
    <section
      aria-label="Selected layout"
      className="flex max-h-64 shrink-0 flex-col gap-2 overflow-auto border-t border-border bg-surface-raised p-2"
      data-layout-controls
    >
      <LayoutActions {...props} />
      <PreciseProperties {...props} first={first} edit={edit} onEditChange={handleEditChange} />
    </section>
  );
}

function PreciseProperties(props: Parameters<typeof LayoutEditorBody>[0]) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <details
      name="schematic-editor"
      data-precise-properties
      open={isOpen}
      onToggle={(event) => {
        setIsOpen(event.currentTarget.open);
        if (!event.currentTarget.open && props.hasPreview) {
          props.onCancel();
        }
      }}
    >
      <summary className="cursor-pointer text-xs focus-visible:outline-2 focus-visible:outline-focus">
        Precise properties
      </summary>
      {isOpen ? <LayoutEditorBody {...props} /> : null}
    </details>
  );
}

function LayoutEditorBody(
  props: LayoutControlsProps & {
    readonly first: Key | undefined;
    readonly edit: LayoutEdit;
    readonly onEditChange: (edit: LayoutEdit) => void;
  },
) {
  const { first, edit } = props;
  function handleEditChange(next: LayoutEdit) {
    props.onEditChange(next);
  }
  return first === undefined ? (
    <p className="text-xs text-text-muted">
      Select a switch and drag outside a corner to rotate. Change keycap size in Bindings.
    </p>
  ) : (
    <>
      <p className="text-xs text-text-muted">
        {edit.keyIds.length} selected. Fields start with the first selected key’s values. Entered
        properties apply to every selected key. Angle alone keeps each key’s center fixed; entering
        an origin uses that absolute point. Preview is unsaved until Apply.
      </p>
      <LayoutFields edit={edit} onEditChange={handleEditChange} schematicKey={first} />
    </>
  );
}
