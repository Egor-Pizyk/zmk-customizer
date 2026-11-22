import type { PartsTableProps } from './parts-list';
import { PartsGroup } from './parts-group';
import { PartsWireSectionsTable } from './parts-wire-sections-table';
import { PartsWiresTable } from './parts-wires-table';
import { PartsCrossingsTable } from './parts-crossings-table';

export function PartsTables(props: PartsTableProps) {
  return (
    <>
      <PartsGroup title="Wire sections">
        <PartsWireSectionsTable {...props} hasHeading={false} />
      </PartsGroup>
      <PartsGroup title="Wires">
        <PartsWiresTable {...props} />
      </PartsGroup>
      <PartsGroup title="Crossings">
        <PartsCrossingsTable {...props} />
      </PartsGroup>
    </>
  );
}
