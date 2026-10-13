import { useId } from 'react';
import type { SyntheticEvent } from 'react';
import type { Project } from '@domain';
import { usePreferences } from '@ui/preferences';
import { BindingsTableRows } from './bindings-table-rows';
import type { BindingsTableRowsProps } from './bindings-table-rows';

type BindingsTableProps = Omit<BindingsTableRowsProps, 'project'> & { readonly project: Project };

// The complete non-canvas alternative (AGENTS §7.8, spec 004 FR-019); open state is a preference.
export function BindingsTable(props: BindingsTableProps) {
  const { preferences, changePreferences } = usePreferences();
  const headingId = useId();

  function handleToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    changePreferences({ isBindingsTableOpen: event.currentTarget.open });
  }

  return (
    <section
      aria-labelledby={headingId}
      className="shrink-0 border-t border-border bg-surface-raised"
      data-bindings-table
    >
      <details onToggle={handleToggle} open={preferences.isBindingsTableOpen}>
        <summary className="cursor-pointer px-4 py-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus">
          <h2 className="inline text-base font-semibold" id={headingId}>
            Keys
          </h2>
        </summary>
        <div className="max-h-72 overflow-auto overscroll-contain px-4 pb-4">
          <table className="w-full text-left">
            <TableHead layerName={props.project.layers[props.layerIndex]?.name ?? ''} />
            <tbody>
              <BindingsTableRows {...props} />
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

function TableHead({ layerName }: { readonly layerName: string }) {
  return (
    <thead className="text-xs text-text-muted">
      <tr>
        <th scope="col">
          <span className="sr-only">Select</span>
        </th>
        <th scope="col">Key</th>
        <th scope="col">{`Action (${layerName})`}</th>
        <th scope="col">
          <span className="sr-only">Choose</span>
        </th>
      </tr>
    </thead>
  );
}
