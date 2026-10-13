import { useState } from 'react';
import { getWiringCells } from '@domain';
import type { Half, Project } from '@domain';
import { Button, Field, INPUT_CLASSES } from '@ui/components';

export function WiringGrid({
  project,
  half,
  onAssignCell: handleAssignCell,
}: {
  readonly project: Project;
  readonly half: Half;
  readonly onAssignCell: (input: { keyId: string; row: number; col: number; half: Half }) => void;
}) {
  const [selectedKeyId, setSelectedKeyId] = useState(project.keys[0]?.id ?? '');
  return (
    <div className="flex flex-col gap-2 overflow-auto">
      <Field
        label={`${half} key to assign`}
        renderControl={(props) => (
          <select
            {...props}
            className={INPUT_CLASSES}
            value={selectedKeyId}
            onChange={(event) => {
              setSelectedKeyId(event.target.value);
            }}
          >
            <option value="">Select a key</option>
            {project.keys.map((key, index) => (
              <option key={key.id} value={key.id}>{`Key ${index}`}</option>
            ))}
          </select>
        )}
      />
      <MatrixCells
        project={project}
        half={half}
        selectedKeyId={selectedKeyId}
        onAssignCell={handleAssignCell}
      />
    </div>
  );
}

function MatrixCells({
  project,
  half,
  selectedKeyId,
  onAssignCell: handleAssignCell,
}: Parameters<typeof WiringGrid>[0] & { readonly selectedKeyId: string }) {
  const cells = getWiringCells(project);
  const terminals = project.wiring?.terminals.filter((terminal) => terminal.half === half) ?? [];
  const rows =
    project.wiring?.kind === 'direct'
      ? 1
      : terminals.filter((terminal) => terminal.kind === 'row').length;
  const cols = terminals.filter(
    (terminal) => terminal.kind === (project.wiring?.kind === 'direct' ? 'input' : 'col'),
  ).length;

  return (
    <table className="text-left">
      <caption>{`${half} electrical matrix`}</caption>
      <tbody>
        {Array.from({ length: rows }, (_, row) => (
          <tr key={row}>
            {Array.from({ length: cols }, (_column, col) => (
              <MatrixCell
                key={col}
                project={project}
                cells={cells}
                half={half}
                row={row}
                col={col}
                selectedKeyId={selectedKeyId}
                onAssignCell={handleAssignCell}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MatrixCell({
  project,
  cells,
  half,
  row,
  col,
  selectedKeyId,
  onAssignCell: handleAssignCell,
}: Parameters<typeof MatrixCells>[0] & {
  readonly row: number;
  readonly col: number;
  readonly cells: ReturnType<typeof getWiringCells>;
}) {
  const occupants = cells
    .filter((cell) => cell.half === half && (cell.row ?? 0) === row && cell.col === col)
    .map((cell) => `Key ${project.keys.findIndex((key) => key.id === cell.keyId)}`);
  return (
    <td key={col} className="border border-border-strong p-1">
      <Button
        variant="secondary"
        aria-label={`${half} row ${row} col ${col}: ${occupants.join(', ') || 'empty'}`}
        isDisabled={selectedKeyId === ''}
        onClick={() => {
          handleAssignCell({ keyId: selectedKeyId, row, col, half });
        }}
      >
        {occupants.join(', ') || 'Empty'}
        {occupants.length > 1 ? ' — conflict' : ''}
      </Button>
    </td>
  );
}
