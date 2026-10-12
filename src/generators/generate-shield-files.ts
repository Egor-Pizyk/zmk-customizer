import type { ShieldMatrix } from '../domain/derive-shield-matrix';
import type { ControllerBoard, Project } from '../domain/types';
import { generateConf } from './generate-conf';
import { generateKconfigDefconfig } from './generate-kconfig-defconfig';
import { generateKconfigShield } from './generate-kconfig-shield';
import { generateKeymap } from './generate-keymap';
import { generateOverlay } from './generate-overlay';
import type { GeneratedFile } from './generated-file';

// Project and matrix have passed domain validation; generators never perform validation.
export function generateShieldFiles(
  project: Project,
  matrix: ShieldMatrix,
  target: Pick<ControllerBoard, 'connector'>,
): readonly GeneratedFile[] {
  return [
    generateKconfigShield(project),
    generateKconfigDefconfig(project),
    generateOverlay(project, matrix, target),
    generateKeymap(project),
    generateConf(project),
  ];
}
