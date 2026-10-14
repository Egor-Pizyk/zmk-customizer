import { getControllerBoard } from '@catalog/controllers';
import { formatBoardPin, findBoardPinUser } from '@domain/wires';
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
  const { project, commit, issues, wireIndex, side } = props;
  const wire = project.wires[wireIndex];
  const endPath = `wires.${wireIndex}.${side}`;
  const errors = issues
    .filter(
      (issue) => issue.path.join('.').startsWith(`${endPath}.`) || issue.path.join('.') === endPath,
    )
    .map((issue) => issue.message)
    .join(' ');

  function handleChange(event: { readonly target: { readonly value: string } }) {
    if (wire === undefined || event.target.value === DROPPED) {
      return;
    }
    const next = event.target.value === NOT_CONNECTED ? undefined : Number(event.target.value);
    commit((current) => setWireEndBoardPin(current, { wireId: wire.id, side, boardPin: next }));
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
  const value = dropped === undefined ? assignedValue : DROPPED;
  return (
    <select
      {...controlProps}
      className={INPUT_CLASSES}
      data-board-pin-select={`${wire?.id ?? ''}:${side}`}
      data-issue-path={`${endPath} ${endPath}.boardPin`}
      onChange={handleChange}
      value={value}
    >
      <option value={NOT_CONNECTED}>
        {dropped === undefined ? 'Not connected' : 'Clear assignment'}
      </option>
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
  return board.pins.map((pin) => {
    const userIndex = findBoardPinUser(project, {
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
