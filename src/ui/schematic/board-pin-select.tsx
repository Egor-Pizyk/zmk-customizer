import { getControllerBoard } from '../../catalog/get-controller-board';
import { formatBoardPin } from '../../domain/board-pin';
import { findBoardPinUser } from '../../domain/find-board-pin-user';
import { setWireEndBoardPin } from '../../domain/set-wire-end-board-pin';
import type { WireEndSide } from '../../domain/types';
import type { FieldControlProps } from '../components/field';
import { Field } from '../components/field';
import { INPUT_CLASSES } from '../components/input-classes';
import type { PartsTableProps } from './parts-list';

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
  const { project, wireIndex, side, boardPin, controlProps, onChange: handleChange } = props;
  const board = getControllerBoard(project.controllerId);
  const wire = project.wires[wireIndex];
  const end = wire?.[side];
  const dropped = end?.kind === 'free' ? end.droppedBoardPin : undefined;
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
