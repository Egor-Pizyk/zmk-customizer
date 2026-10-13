import { CONTROLLER_BOARDS, getControllerBoard } from '@catalog/controllers';
import { UNIBODY_PRESET } from '@catalog/presets';

export function getControllerFixtures() {
  return { boards: CONTROLLER_BOARDS, project: UNIBODY_PRESET, getBoard: getControllerBoard };
}
