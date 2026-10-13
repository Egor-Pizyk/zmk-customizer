import type { WiringCell, Half, Project } from '@domain';
import { getWiringCells } from '@domain';
import { NumberInput, INPUT_CLASSES } from '@ui/components';

export function WiringTable({
  project,
  onAssignCell: handleAssignCell,
}: {
  readonly project: Project;
  readonly onAssignCell: (input: { keyId: string; row: number; col: number; half: Half }) => void;
}) {
  const cells = getWiringCells(project);
  return (
    <div className="overflow-auto">
      <table className="w-full text-left">
        <caption>Key wiring assignments</caption>
        <thead>
          <tr>
            {['Key', 'Half', 'Row', 'Column / input'].map((title) => (
              <th scope="col" key={title}>
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cells.map((cell, keyIndex) => (
            <WiringRow
              key={cell.keyId}
              project={project}
              cell={cell}
              keyIndex={keyIndex}
              onAssignCell={handleAssignCell}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WiringRow({ project, cell, keyIndex, onAssignCell: handleAssignCell }: WiringRowInput) {
  return (
    <tr>
      <th scope="row">{`Key ${keyIndex}`}</th>
      <td>
        <WiringHalfSelect {...{ project, cell, keyIndex, onAssignCell: handleAssignCell }} />
      </td>
      <td>
        {project.wiring?.kind === 'direct' ? (
          '0 (direct)'
        ) : (
          <NumberInput
            label={`Key ${keyIndex} matrix row`}
            issuePath={`keys.${keyIndex}`}
            step={1}
            value={cell.row ?? -1}
            onCommit={(row) => {
              handleAssignCell({ keyId: cell.keyId, row, col: cell.col ?? 0, half: cell.half });
            }}
          />
        )}
      </td>
      <td>
        <NumberInput
          label={`Key ${keyIndex} matrix column`}
          issuePath={`keys.${keyIndex}`}
          step={1}
          value={cell.col ?? -1}
          onCommit={(col) => {
            handleAssignCell({ keyId: cell.keyId, row: cell.row ?? 0, col, half: cell.half });
          }}
        />
      </td>
    </tr>
  );
}

function WiringHalfSelect({
  project,
  cell,
  keyIndex,
  onAssignCell: handleAssignCell,
}: Parameters<typeof WiringRow>[0]) {
  return (
    <select
      aria-label={`Key ${keyIndex} half`}
      className={INPUT_CLASSES}
      value={cell.half}
      onChange={(event) => {
        handleAssignCell({
          keyId: cell.keyId,
          row: cell.row ?? 0,
          col: cell.col ?? 0,
          half: event.target.value === 'right' ? 'right' : 'left',
        });
      }}
    >
      <option value="left">Left</option>
      {project.wiring?.topology === 'split' ? <option value="right">Right</option> : undefined}
    </select>
  );
}

type WiringRowInput = {
  readonly project: Project;
  readonly cell: WiringCell;
  readonly keyIndex: number;
  readonly onAssignCell: (input: { keyId: string; row: number; col: number; half: Half }) => void;
};
