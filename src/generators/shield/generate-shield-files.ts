import { generateSplitOverlays } from './generate-split-overlays';
import type { ShieldMatrix } from '@domain/wiring/matrix';
import type { ControllerBoard, Project } from '@domain';
import { generateConf } from '@generators';
import type { GeneratedFile } from '@generators';
import { generateKconfigDefconfig } from './generate-kconfig-defconfig';
import { generateKconfigShield } from './generate-kconfig-shield';
import { generateKeymap } from '@generators/keymap';
import { generateOverlay } from './generate-overlay';

// Project and matrix have passed domain validation; generators never perform validation.
export function generateShieldFiles(
  project: Project,
  matrix: ShieldMatrix,
  target: Pick<ControllerBoard, 'connector'>,
): readonly GeneratedFile[] {
  return [
    generateKconfigShield(project),
    generateKconfigDefconfig(project),
    ...(matrix.halves === undefined
      ? [generateOverlay(project, matrix, target)]
      : generateSplitOverlays(project, { ...matrix, halves: matrix.halves }, target)),
    generateKeymap(project),
    generateConf(project),
  ];
}
