import { CONTROLLER_BOARDS } from '../../src/catalog/controller-boards';
import { getControllerBoard } from '../../src/catalog/get-controller-board';
import { UNIBODY_PRESET } from '../../src/catalog/unibody-preset';

export function getControllerFixtures() {
  return { boards: CONTROLLER_BOARDS, project: UNIBODY_PRESET, getBoard: getControllerBoard };
}
