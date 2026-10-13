import { getControllerFixtures } from '../../../helpers/controller-fixtures';
import { expect, it } from 'vitest';
import { changeController, validateControllerPins, setWireEndBoardPin } from '@domain';

const {
  getBoard: getControllerBoard,
  boards: CONTROLLER_BOARDS,
  project: UNIBODY_PRESET,
} = getControllerFixtures();

it('reports each dropped endpoint with its actionable endpoint path', () => {
  const changed = changeController(UNIBODY_PRESET, {
    boardId: 'seeeduino_xiao_ble',
    boards: CONTROLLER_BOARDS,
  });
  const issues = validateControllerPins(changed, getControllerBoard(changed.controllerId));
  expect(issues).toHaveLength(5);
  expect(issues[0]).toMatchObject({
    code: 'board-pin-dropped',
    path: ['wires', 0, 'end', 'boardPin'],
  });
  expect(issues[0]?.message).toContain('nice!nano v2 D2');
  const assigned = setWireEndBoardPin(changed, { wireId: 'w0', side: 'end', boardPin: 0 });
  expect(validateControllerPins(assigned, getControllerBoard(changed.controllerId))).toHaveLength(
    4,
  );
});
it('rejects unavailable connector positions and accepts all exposed positions', () => {
  expect(validateControllerPins(UNIBODY_PRESET, getControllerBoard('nice_nano_v2'))).toEqual([]);
  const invalid = setWireEndBoardPin(UNIBODY_PRESET, { wireId: 'w0', side: 'end', boardPin: 11 });
  expect(validateControllerPins(invalid, getControllerBoard('nice_nano_v2'))).toEqual([
    expect.objectContaining({
      code: 'shield-pin-unsupported',
      path: ['wires', 0, 'end', 'boardPin'],
    }),
  ]);
});
