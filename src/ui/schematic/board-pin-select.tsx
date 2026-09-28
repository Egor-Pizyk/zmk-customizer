import type { ChangeEvent } from 'react';
import { BOARD_PIN_COUNT, formatBoardPin } from '../../domain/board-pin';
import { findBoardPinUser } from '../../domain/find-board-pin-user';
import { setWireEndBoardPin } from '../../domain/set-wire-end-board-pin';
import type { WireEndSide } from '../../domain/types';
import { INPUT_CLASSES } from '../components/input-classes';
import type { PartsTableProps } from './parts-list';

type BoardPinSelectProps = Pick<PartsTableProps, 'project' | 'commit' | 'issues'> & {
  readonly wireIndex: number;
  readonly side: WireEndSide;
  readonly boardPin: number | undefined;
};

const BOARD_PINS = Array.from({ length: BOARD_PIN_COUNT }, (_unused, boardPin) => boardPin);
const NOT_CONNECTED = '';

// FR-018..020: a free end picks a generic board pin; pins used elsewhere say by which wire.
export function BoardPinSelect(props: BoardPinSelectProps) {
  const { project, commit, issues, wireIndex, side, boardPin } = props;
  const wire = project.wires[wireIndex];
  const endPath = `wires.${wireIndex}.${side}`;
  const hasProblem = issues.some((issue) => issue.path.join('.').startsWith(endPath));

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target;
    if (wire === undefined) {
      return;
    }
    const next = value === NOT_CONNECTED ? undefined : Number(value);
    commit((current) => setWireEndBoardPin(current, { wireId: wire.id, side, boardPin: next }));
  }

  return (
    <select
      aria-invalid={hasProblem || undefined}
      aria-label={`Wire ${wireIndex} ${side} board pin`}
      className={INPUT_CLASSES}
      data-board-pin-select={`${wire?.id ?? ''}:${side}`}
      data-issue-path={`${endPath} ${endPath}.boardPin`}
      onChange={handleChange}
      value={boardPin === undefined ? NOT_CONNECTED : String(boardPin)}
    >
      <option value={NOT_CONNECTED}>Not connected</option>
      {BOARD_PINS.map((candidate) => {
        const userIndex = findBoardPinUser(project, {
          boardPin: candidate,
          except: { wireId: wire?.id ?? '', side },
        });
        const suffix = userIndex === undefined ? '' : ` (used by wire ${userIndex})`;
        return (
          <option key={candidate} value={String(candidate)}>
            {`${formatBoardPin(candidate)}${suffix}`}
          </option>
        );
      })}
    </select>
  );
}
