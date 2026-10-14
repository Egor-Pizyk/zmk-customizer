import { DEFAULT_CONTROLLER_ID, getControllerBoard } from '@catalog/controllers';
import type { ControllerBoard } from '@domain';
import type { ShieldTarget } from '@domain/wiring/matrix';

// Release/workflow metadata plus the default controller; production selects the project board.
export const SHIELD_TARGET = {
  boardId: DEFAULT_CONTROLLER_ID,
  connector: 'pro_micro',
  zmkVersion: 'v0.3.0',
  revision: 'v0.3',
  workflowDocsUrl: 'https://v0-3-branch.zmk.dev/docs/user-setup#download-the-archive',
  workflowDescription: 'Build firmware with GitHub Actions when you push the exported repository.',
  workflowPath: 'zmkfirmware/zmk/.github/workflows/build-user-config.yml',
  gpioPins: getControllerBoard(DEFAULT_CONTROLLER_ID).gpioPins,
  description:
    'Dn identifies the controller connector position; MCU labels identify the physical GPIO.',
  docsUrl: 'https://v0-3-branch.zmk.dev/docs/hardware#controllers',
} as const satisfies ShieldTarget &
  Pick<ControllerBoard, 'connector'> & {
    readonly zmkVersion: string;
    readonly revision: string;
    readonly workflowPath: string;
    readonly workflowDocsUrl: string;
    readonly workflowDescription: string;
    readonly description: string;
    readonly docsUrl: string;
  };
