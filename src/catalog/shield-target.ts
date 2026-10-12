import { getControllerBoard } from './get-controller-board';
import type { ControllerBoard } from '../domain/types';
import type { ShieldTarget } from '../domain/derive-shield-matrix';

// Release/workflow metadata plus the default controller; production selects the project board.
export const SHIELD_TARGET = {
  boardId: 'nice_nano_v2',
  connector: 'pro_micro',
  zmkVersion: 'v0.3.0',
  revision: 'v0.3',
  workflowDocsUrl: 'https://v0-3-branch.zmk.dev/docs/user-setup#download-the-archive',
  workflowDescription: 'Build firmware with GitHub Actions when you push the exported repository.',
  workflowPath: 'zmkfirmware/zmk/.github/workflows/build-user-config.yml',
  gpioPins: getControllerBoard('nice_nano_v2').gpioPins,
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
