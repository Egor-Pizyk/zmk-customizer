import { useState } from 'react';
import { getWireSections } from '@domain/wires';
import { removeWireSections } from '@domain/wires/editing';
import { Button } from '@ui/components/components';
import type { PartsTableProps } from './parts-list';
import type { KeyboardEvent } from 'react';

export function PartsWireSectionsTable({
  project,
  selection,
  onSelectionChange,
  commit,
}: PartsTableProps) {
  const [focused, setFocused] = useState(0);
  const { sections, selected, handleDelete, toggle, handleKey, failure } = useSectionActions({
    project,
    selection,
    onSelectionChange,
    commit,
  });
  return (
    <section aria-label="Wire sections" className="flex flex-col gap-2">
      <h3 className="font-semibold">Wire sections</h3>
      {failure === undefined ? undefined : <p role="alert">{failure}</p>}
      <p className="text-text-muted">Delete sections; keep keys and other branches.</p>
      <SectionChoices
        sections={sections}
        selected={selected}
        focused={focused}
        setFocused={setFocused}
        toggle={toggle}
        onKey={handleKey}
      />
      <Button onClick={handleDelete} isDisabled={selected.length === 0}>
        Delete selected sections
      </Button>
    </section>
  );
}

function useSectionActions({
  project,
  selection,
  onSelectionChange,
  commit,
}: Omit<PartsTableProps, 'issues'>) {
  const [failure, setFailure] = useState<string>();
  const sections = getWireSections(project);
  const selected =
    selection?.kind === 'sections' && selection.base === project ? selection.sectionIds : [];
  function toggle(id: string) {
    const sectionIds = selected.includes(id)
      ? selected.filter((entry) => entry !== id)
      : [...selected, id];
    onSelectionChange({ kind: 'sections', base: project, sectionIds });
  }
  function handleDelete() {
    const result = removeWireSections(project, { base: project, sectionIds: selected });
    if (!result.ok) {
      setFailure(result.error);
      return;
    }
    commit(
      (current) => (current === project ? result.value : current),
      `Deleted ${selected.length} wire sections. Undo`,
    );
    setFailure(undefined);
    onSelectionChange();
    requestAnimationFrame(focusCanvas);
  }
  const handleKey = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      handleDelete();
      return;
    }
    focusSection(event, { sections, index });
  };
  return { sections, selected, handleDelete, toggle, handleKey, failure };
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
  document.querySelector<SVGSVGElement>('[data-canvas-workspace="schematic"]')?.focus();
}
