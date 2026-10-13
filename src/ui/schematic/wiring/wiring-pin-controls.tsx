import { getProjectAnalysis } from '@ui/project';
import { getControllerBoard } from '@catalog/controllers';
import type { WiringEdit, Half, Project } from '@domain';
import { Field, INPUT_CLASSES } from '@ui/components';

export function WiringPinControls({ project, half, onEdit: handleEdit }: WiringPinControlsInput) {
  const board = getControllerBoard(project.controllerId);
  const issues = getProjectAnalysis(project).issues;
  const terminals = project.wiring?.terminals.filter((terminal) => terminal.half === half) ?? [];
  return (
    <>
      {terminals.map((terminal) => {
        const index = terminals.filter((entry) => entry.kind === terminal.kind).indexOf(terminal);
        return terminal.kind === 'ground' ? (
          <p key={terminal.id}>GND — common switch ground</p>
        ) : (
          <Field
            key={terminal.id}
            label={`${half} ${terminal.kind} ${index} pin`}
            error={getPinError(issues, project.wiring?.terminals.indexOf(terminal))}
            renderControl={(control) => (
              <select
                {...control}
                data-issue-path={`wiring.terminals.${project.wiring?.terminals.indexOf(terminal)}.boardPin`}
                className={INPUT_CLASSES}
                value={terminal.boardPin ?? ''}
                onChange={(event) => {
                  handleEdit({
                    kind: 'pin',
                    terminalId: terminal.id,
                    boardPin: event.target.value === '' ? undefined : Number(event.target.value),
                    board,
                  });
                }}
              >
                <WiringPinOptions project={project} terminal={terminal} />
              </select>
            )}
          />
        );
      })}
    </>
  );
}

type WiringPinControlsInput = {
  readonly project: Project;
  readonly half: Half;
  readonly onEdit: (input: WiringEdit) => void;
};

function WiringPinOptions({
  project,
  terminal,
}: {
  readonly project: Project;
  readonly terminal: NonNullable<Project['wiring']>['terminals'][number];
}) {
  const board = getControllerBoard(project.controllerId);
  return (
    <>
      <option value="">
        {terminal.droppedBoardPin === undefined
          ? 'Unassigned'
          : `Unassigned (was ${terminal.droppedBoardPin})`}
      </option>
      {terminal.boardPin !== undefined && !board.gpioPins.includes(terminal.boardPin) ? (
        <option value={terminal.boardPin}>{`D${terminal.boardPin} (unavailable)`}</option>
      ) : undefined}
      {board.pins.map((pin) => (
        <option key={pin.index} value={pin.index}>{`${pin.label} · ${pin.mcu}`}</option>
      ))}
    </>
  );
}

function getPinError(
  issues: ReturnType<typeof getProjectAnalysis>['issues'],
  terminalIndex: number | undefined,
) {
  return (
    issues
      .filter((issue) => issue.path.join('.') === `wiring.terminals.${terminalIndex}.boardPin`)
      .map((issue) => issue.message)
      .join(' ') || undefined
  );
}
