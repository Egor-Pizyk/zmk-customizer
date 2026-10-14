import { getControllerBoard } from '@catalog/controllers';
import type { WiringEdit } from '@domain/wiring/editing';
import type { Half, Project } from '@domain';
import { NumberInput } from '@ui/components/components';
import { WiringGrid } from './wiring-grid';
import { WiringPinControls } from './wiring-pin-controls';

export function WiringHalfControls({
  project,
  half,
  onEdit: handleEdit,
  onAssignCell: handleAssignCell,
}: WiringHalfControlsInput) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-semibold">{`${half} wiring`}</legend>
      <div className="flex flex-wrap gap-2">
        <WiringDimensions project={project} half={half} onEdit={handleEdit} />
        <WiringPinControls project={project} half={half} onEdit={handleEdit} />
      </div>
      <WiringGrid project={project} half={half} onAssignCell={handleAssignCell} />
    </fieldset>
  );
}

type WiringHalfControlsInput = {
  readonly project: Project;
  readonly half: Half;
  readonly onEdit: (input: WiringEdit) => void;
  readonly onAssignCell: (input: { keyId: string; row: number; col: number; half: Half }) => void;
};

function WiringDimensions({
  project,
  half,
  onEdit: handleEdit,
}: Omit<WiringHalfControlsInput, 'onAssignCell'>) {
  const { rows, cols } = getHalfDimensions(project, half);
  const handleDimensions = createDimensionsHandler(project, half, handleEdit);
  return (
    <>
      {project.wiring?.kind === 'matrix' ? (
        <div className="flex w-28 flex-col gap-1">
          Rows
          <NumberInput
            label={`${half} rows`}
            value={rows}
            step={1}
            onCommit={(value) => {
              handleDimensions(value, cols);
            }}
          />
        </div>
      ) : undefined}
      <div className="flex w-28 flex-col gap-1">
        {project.wiring?.kind === 'direct' ? 'Inputs' : 'Columns'}
        <NumberInput
          label={`${half} columns`}
          value={cols}
          step={1}
          onCommit={(value) => {
            handleDimensions(Math.max(1, rows), value);
          }}
        />
      </div>
    </>
  );
}

function getHalfDimensions(project: Project, half: Half) {
  const terminals = project.wiring?.terminals.filter((terminal) => terminal.half === half) ?? [];
  const rows = terminals.filter((terminal) => terminal.kind === 'row').length;
  const cols = terminals.filter(
    (terminal) => terminal.kind === (project.wiring?.kind === 'direct' ? 'input' : 'col'),
  ).length;

  return { rows, cols };
}

function createDimensionsHandler(
  project: Project,
  half: Half,
  handleEdit: WiringHalfControlsInput['onEdit'],
) {
  function handleDimensions(nextRows: number, nextCols: number) {
    handleEdit({
      kind: 'dimensions',
      half,
      rows: nextRows,
      cols: nextCols,
      board: getControllerBoard(project.controllerId),
    });
  }

  return handleDimensions;
}
