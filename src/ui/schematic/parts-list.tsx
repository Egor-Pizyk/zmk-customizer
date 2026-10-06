import { useId } from 'react';
import type { SyntheticEvent } from 'react';
import { getKeyPinWires } from '../../domain/get-key-pin-wires';
import type { Project } from '../../domain/types';
import { usePreferences } from '../preferences-context';
import type { WorkspaceIssue } from '../shell/workspace-issue';
import { PartsCrossingsTable } from './parts-crossings-table';
import { PartsKeysTable } from './parts-keys-table';
import { PartsWiresTable } from './parts-wires-table';
import type { SchematicSelection, SelectionChange } from './schematic-selection';

export type PartsTableProps = {
  readonly project: Project;
  readonly issues: readonly WorkspaceIssue[];
  readonly selection: SchematicSelection;
  readonly onSelectionChange: SelectionChange;
  readonly commit: (change: (project: Project) => Project, announcementText?: string) => void;
};

// The complete non-canvas alternative (FR-029, ADR 0008): every key, wire, crossing and board
// pin, with the same edits as the canvas. Open state is an interface preference.
export function PartsList(props: PartsTableProps) {
  const { preferences, changePreferences } = usePreferences();
  const headingId = useId();
  // One lookup per render (perf: getKeyPinWires walks every wire for every pin).
  const wiresOf = getKeyPinWires(props.project);

  function handleToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    changePreferences({ isPartsListOpen: event.currentTarget.open });
  }

  return (
    <section
      aria-labelledby={headingId}
      className="shrink-0 border-t border-border bg-surface-raised"
    >
      <details onToggle={handleToggle} open={preferences.isPartsListOpen}>
        <summary className="cursor-pointer px-4 py-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus">
          <h2 className="inline text-base font-semibold" id={headingId}>
            Parts
          </h2>
        </summary>
        <div className="flex max-h-72 flex-col gap-6 overflow-auto px-4 pb-4">
          <PartsKeysTable {...props} wiresOf={wiresOf} />
          <PartsWiresTable {...props} />
          <PartsCrossingsTable {...props} />
        </div>
      </details>
    </section>
  );
}
