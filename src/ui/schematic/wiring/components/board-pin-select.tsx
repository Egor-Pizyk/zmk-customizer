import { useProject, getProjectAnalysis } from '@ui/project/logic';
import { refuseProtectedEdit } from '@ui/schematic/interaction';
import { getControllerBoard } from '@catalog/controllers';
import { formatBoardPin } from '@domain/wires';
import { setWireEndBoardPin } from '@domain/wires/editing';
import type { WireEndSide } from '@domain';
import { Field } from '@ui/components/components';
import { INPUT_CLASSES } from '@ui/components/logic';
import type { FieldControlProps } from '@ui/components/components';
import type { PartsTableProps } from '@ui/schematic/parts/components';

type BoardPinSelectProps = Pick<PartsTableProps, 'project' | 'commit' | 'issues'> & {
  readonly wireIndex: number;
  readonly side: WireEndSide;
  readonly boardPin: number | undefined;
};
const NOT_CONNECTED = '';
const DROPPED = 'dropped';

export function BoardPinSelect(props: BoardPinSelectProps) {
  const { issues, wireIndex, side } = props;
  const { announce } = useProject();
  const endPath = `wires.${wireIndex}.${side}`;
  const errors = issues
    .filter(
      (issue) => issue.path.join('.').startsWith(`${endPath}.`) || issue.path.join('.') === endPath,
    )
    .map((issue) => issue.message)
    .join(' ');

  function handleChange(event: { readonly target: { readonly value: string } }) {
    handleBoardPinChange(props, event.target.value, announce);
  }

  return (
    <Field
      label={`Wire ${wireIndex} ${side} board pin`}
      error={errors === '' ? undefined : errors}
      renderControl={(controlProps) => (
        <NativePinSelect {...props} controlProps={controlProps} onChange={handleChange} />
      )}
    />
  );
}

type NativePinSelectProps = BoardPinSelectProps & {
  readonly controlProps: FieldControlProps;
  readonly onChange: (event: { readonly target: { readonly value: string } }) => void;
};
function NativePinSelect(props: NativePinSelectProps) {
  const { project, wireIndex, side, controlProps, onChange: handleChange } = props;
  const board = getControllerBoard(project.controllerId);
  const wire = project.wires[wireIndex];
  const { terminal, boardPin, dropped } = getEndpointAssignment(props);
  if (terminal?.kind === 'ground') {
    return <span>GND — common switch ground</span>;
  }
  const endPath = `wires.${wireIndex}.${side}`;
  const hasUnavailablePin = boardPin !== undefined && !board.gpioPins.includes(boardPin);
  const assignedValue = boardPin === undefined ? NOT_CONNECTED : String(boardPin);
  const end = wire?.[side];
  const previousValue = dropped === undefined ? assignedValue : DROPPED;
  const value = end?.kind === 'free' && end.ground === true ? 'ground' : previousValue;
  return (
    <select
      {...controlProps}
      className={INPUT_CLASSES}
      data-board-pin-select={`${wire?.id ?? ''}:${side}`}
      data-issue-path={`${endPath} ${endPath}.boardPin`}
      onChange={handleChange}
      value={value}
    >
      <AssignmentOptions hasDropped={dropped !== undefined} />
      {dropped === undefined ? undefined : (
        <option value={DROPPED} disabled>{`Unassigned (was ${dropped})`}</option>
      )}
      {hasUnavailablePin ? (
        <option value={String(boardPin)}>{`${formatBoardPin(boardPin)} (unavailable)`}</option>
      ) : undefined}
      {getPinOptions(props).map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
function getPinOptions({ project, wireIndex, side }: BoardPinSelectProps) {
  const board = getControllerBoard(project.controllerId);
  const findUser = getProjectAnalysis(project).boardPinUsers;
  return board.pins.map((pin) => {
    const userIndex = findUser({
      boardPin: pin.index,
      except: { wireId: project.wires[wireIndex]?.id ?? '', side },
    });
    const suffix = userIndex === undefined ? '' : ` (used by wire ${userIndex})`;
    return { value: pin.index, label: `${pin.label} · ${pin.mcu}${suffix}` };
  });
}

function getEndpointAssignment(props: NativePinSelectProps) {
  const { project, wireIndex, side } = props;
  const end = project.wires[wireIndex]?.[side];
  const terminal =
    end?.kind === 'free'
      ? project.wiring?.terminals.find((entry) => entry.id === end.terminalId)
      : undefined;
  const boardPin = terminal?.boardPin ?? props.boardPin;
  const dropped =
    terminal?.droppedBoardPin ?? (end?.kind === 'free' ? end.droppedBoardPin : undefined);

  return { terminal, boardPin, dropped };
}

function AssignmentOptions({ hasDropped }: { readonly hasDropped: boolean }) {
  return (
    <>
      <option value="ground">GND</option>
      <option value={NOT_CONNECTED}>{hasDropped ? 'Clear assignment' : 'Not connected'}</option>
    </>
  );
}

function handleBoardPinChange(
  { project, commit, wireIndex, side }: BoardPinSelectProps,
  value: string,
  announce: (text: string) => void,
) {
  const wire = project.wires[wireIndex];
  if (wire === undefined || value === DROPPED) {
    return;
  }
  const terminalIds = [wire.start, wire.end].flatMap((end) =>
    end.kind === 'free' && end.terminalId !== undefined ? [end.terminalId] : [],
  );
  if (refuseProtectedEdit({ project, onHint: announce }, { wireIds: [wire.id], terminalIds })) {
    return;
  }
  const next = value === NOT_CONNECTED || value === 'ground' ? undefined : Number(value);
  commit((current) =>
    setWireEndBoardPin(current, {
      wireId: wire.id,
      side,
      boardPin: next,
      ground: value === 'ground',
    }),
  );
}
