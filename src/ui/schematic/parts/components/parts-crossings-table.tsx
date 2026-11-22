import { toggleCrossingInsulation } from '@domain/crossings';
import type { Crossing } from '@domain/crossings';
import { getProjectAnalysis } from '@ui/project/logic';
import { Switch } from '@ui/components/components';
import type { PartsTableProps } from './parts-list';
import { PartsTableHead } from './parts-table-head';

const COLUMNS = ['Crossing', 'Position (u)', 'State'];

// FR-014 from the keyboard; also the only path below 50% zoom where canvas buttons hide.
export function PartsCrossingsTable(props: PartsTableProps) {
  const crossings = getProjectAnalysis(props.project).crossings;
  return (
    <div className="flex flex-col gap-2">
      {crossings.length === 0 ? (
        <p className="text-text-muted">
          No wires cross. Crossings appear here when two wires cross.
        </p>
      ) : (
        <table className="w-full text-left">
          <PartsTableHead columns={COLUMNS} hasActions={false} />
          <tbody>
            {crossings.map((crossing) => (
              <CrossingRow
                {...props}
                crossing={crossing}
                key={`${crossing.ref.wireIds.join('×')}:${crossing.ref.ordinal}`}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function CrossingRow({
  project,
  commit,
  crossing,
}: PartsTableProps & { readonly crossing: Crossing }) {
  const [first, second] = crossing.ref.wireIds.map((wireId) =>
    project.wires.findIndex((wire) => wire.id === wireId),
  );
  const name = `Wire ${first} × wire ${second}`;

  function handleInsulatedChange() {
    commit((current) => toggleCrossingInsulation(current, { ref: crossing.ref }));
  }

  return (
    <tr>
      <th className="pr-2 font-medium" scope="row">
        {name}
      </th>
      <td className="pr-2">{`${crossing.at.xU}, ${crossing.at.yU}`}</td>
      <td>
        <Switch
          isChecked={crossing.isInsulated}
          label={`Insulated (${name.toLowerCase()})`}
          onChange={handleInsulatedChange}
        />
      </td>
    </tr>
  );
}
