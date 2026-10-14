import { changeController } from '@domain/project';
import { setWireEndBoardPin } from '@domain/wires/editing';
import { getControllerFixtures } from '../../../helpers/controller-fixtures';
import { expect, it } from 'vitest';

const { boards: CONTROLLER_BOARDS, project: UNIBODY_PRESET } = getControllerFixtures();

it('preserves exact wiring and all non-controller content within a connector family', () => {
  const changed = changeController(UNIBODY_PRESET, {
    boardId: 'adafruit_kb2040',
    boards: CONTROLLER_BOARDS,
  });
  expect(changed).toEqual({ ...UNIBODY_PRESET, controllerId: 'adafruit_kb2040' });
  expect(changed.wires).toEqual(UNIBODY_PRESET.wires);
  expect(UNIBODY_PRESET.controllerId).toBe('nice_nano_v2');
});
it('returns the same project for same or unknown board', () => {
  for (const boardId of ['nice_nano_v2', 'bogus']) {
    expect(changeController(UNIBODY_PRESET, { boardId, boards: CONTROLLER_BOARDS })).toBe(
      UNIBODY_PRESET,
    );
  }
});
it('clears every cross-family assignment and preserves previous labels until reassigned', () => {
  const changed = changeController(UNIBODY_PRESET, {
    boardId: 'seeeduino_xiao_ble',
    boards: CONTROLLER_BOARDS,
  });
  const assigned = changed.wires
    .flatMap((wire) => [wire.start, wire.end])
    .filter((end) => end.kind === 'free');
  expect(assigned).toHaveLength(5);
  for (const end of assigned) {
    expect(end.boardPin).toBeUndefined();
    expect(end.droppedBoardPin).toMatch(/^nice!nano v2 D/u);
  }
  expect(changed.keys).toBe(UNIBODY_PRESET.keys);
  expect(changed.layers).toBe(UNIBODY_PRESET.layers);
  expect(changed.insulatedCrossings).toBe(UNIBODY_PRESET.insulatedCrossings);
  const again = changeController(changed, {
    boardId: 'sparkfun_pro_micro_rp2040',
    boards: CONTROLLER_BOARDS,
  });
  expect(again.wires).toEqual(changed.wires);
  for (const boardPin of [undefined, 0]) {
    const reassigned = setWireEndBoardPin(changed, { wireId: 'w0', side: 'end', boardPin });
    expect(reassigned.wires[0]?.end).not.toHaveProperty('droppedBoardPin');
  }
});
it('drops a pin absent from a new board even within the same family', () => {
  const old = CONTROLLER_BOARDS[0];
  const changed = changeController(UNIBODY_PRESET, {
    boardId: 'limited',
    boards: [old, { ...old, id: 'limited', gpioPins: [6, 8, 9, 10] }],
  });
  expect(changed.wires[0]?.end).toMatchObject({ droppedBoardPin: 'nice!nano v2 D2' });
  expect(changed.wires[1]?.end).toMatchObject({ boardPin: 8 });
});
