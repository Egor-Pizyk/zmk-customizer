import { useState } from 'react';
import { getWireSections } from '@domain/wires';
import { removeKeysAndSections } from '@domain/keys';
import {
  getKeySectionSelection,
  getSelectedKeyIds,
  getSelectedSectionIds,
} from '@ui/schematic/interaction';
import { Button } from '@ui/components/components';
import type { PartsTableProps } from './parts-list';
import type { KeyboardEvent } from 'react';

type SectionTableProps = PartsTableProps & { readonly isReadOnly?: boolean };

export function PartsWireSectionsTable(props: SectionTableProps) {
  const [focused, setFocused] = useState(0);
  const { sections, selected, handleDelete, toggle, handleKey, failure, keyIds } =
    useSectionActions(props);
  return (
    <section aria-label="Wire sections" className="flex flex-col gap-2">
      <h3 className="font-semibold">Wire sections</h3>
      {failure === undefined ? undefined : <p role="alert">{failure}</p>}
      <p className="text-text-muted">
        {props.isReadOnly === true
          ? 'Select sections to inspect the preview.'
          : 'Delete only the selected objects; keep other branches.'}
      </p>
      {keyIds.length > 0 ? (
        <p>{`Selected keys: ${keyIds.length}; wire sections: ${selected.length}.`}</p>
      ) : null}
      <SectionChoices
        sections={sections}
        selected={selected}
        focused={focused}
        setFocused={setFocused}
        toggle={toggle}
        onKey={handleKey}
      />
      {props.isReadOnly === true ? null : (
        <Button onClick={handleDelete} isDisabled={selected.length === 0}>
          {keyIds.length > 0 ? 'Delete selected keys and sections' : 'Delete selected sections'}
        </Button>
      )}
    </section>
  );
}

function useSectionActions({
  project,
  selection,
  onSelectionChange,
  commit,
  isReadOnly,
}: Omit<SectionTableProps, 'issues'>) {
  const [failure, setFailure] = useState<string>();
  const sections = getWireSections(project);
  const selected = getSelectedSectionIds(project, selection);
  const keyIds =
    selection?.kind === 'sections' && selection.base !== project
      ? []
      : getSelectedKeyIds(selection);
  function toggle(id: string) {
    const sectionIds = selected.includes(id)
      ? selected.filter((entry) => entry !== id)
      : [...selected, id];
    onSelectionChange(getKeySectionSelection(project, { keyIds, sectionIds }));
  }
  function handleDelete() {
    if (isReadOnly === true) {
      return;
    }
    const result = removeKeysAndSections(project, { base: project, sectionIds: selected, keyIds });
    if (!result.ok) {
      setFailure(result.error);
      return;
    }
    commit(
      (current) => (current === project ? result.value : current),
      `Deleted ${keyIds.length} keys and ${selected.length} wire sections. Undo`,
    );
    setFailure(undefined);
    onSelectionChange();
    requestAnimationFrame(focusCanvas);
  }
  const handleKey = createSectionKeyHandler({ sections, handleDelete });
  return { sections, selected, handleDelete, toggle, handleKey, failure, keyIds };
}

function focusSection(
  event: KeyboardEvent<HTMLInputElement>,
  {
    sections,
    index,
  }: { readonly sections: ReturnType<typeof getWireSections>; readonly index: number },
) {
  const offset = event.key === 'ArrowDown' ? 1 : -1;
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
    return;
  }
  event.preventDefault();
  const next = sections[(index + offset + sections.length) % sections.length];
  if (next !== undefined) {
    document.querySelector<HTMLInputElement>(`[data-section-checkbox="${next.id}"]`)?.focus();
  }
}

function SectionChoices({
  sections,
  selected,
  focused,
  setFocused,
  toggle,
  onKey,
}: Pick<ReturnType<typeof useSectionActions>, 'sections' | 'selected' | 'toggle'> & {
  readonly onKey: ReturnType<typeof useSectionActions>['handleKey'];
  readonly focused: number;
  readonly setFocused: (index: number) => void;
}) {
  return sections.map((section, index) => (
    <label className="flex min-h-8 items-center gap-2" key={section.id}>
      <input
        type="checkbox"
        checked={selected.includes(section.id)}
        data-section-checkbox={section.id}
        tabIndex={index === Math.min(focused, sections.length - 1) ? 0 : -1}
        onFocus={() => {
          setFocused(index);
        }}
        onChange={() => {
          toggle(section.id);
        }}
        onKeyDown={(event) => {
          onKey(event, index);
        }}
      />
      {`Section ${index + 1}, ${section.wireId}: ${section.description}`}
    </label>
  ));
}

function focusCanvas() {
  document.querySelector<SVGElement | HTMLElement>('[data-canvas-workspace="schematic"]')?.focus();
}

function createSectionKeyHandler({
  sections,
  handleDelete,
}: {
  readonly sections: ReturnType<typeof getWireSections>;
  readonly handleDelete: () => void;
}) {
  return (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      handleDelete();
      return;
    }
    focusSection(event, { sections, index });
  };
}
