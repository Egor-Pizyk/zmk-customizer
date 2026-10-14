import { getShieldName } from '@domain/project';
import type { ShieldMatrix } from '@domain/wiring/matrix';
import type { ControllerBoard, Project } from '@domain';
import { generateOverlay } from './generate-overlay';
import type { GeneratedFile } from '@generators';

export function generateSplitOverlays(
  project: Project,
  matrix: ShieldMatrix & { readonly halves: NonNullable<ShieldMatrix['halves']> },
  target: Pick<ControllerBoard, 'connector'>,
): readonly GeneratedFile[] {
  const name = getShieldName(project);
  const base = `boards/shields/${name}/${name}`;
  const common = generateOverlay(project, matrix, target);
  const files: GeneratedFile[] = [{ ...common, path: `${base}.dtsi` }];
  for (const half of ['left', 'right'] as const) {
    const scan = matrix.halves[half];
    const inputFlags = '(GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)';
    const rowFlags = matrix.diodeDirection === 'col2row' ? inputFlags : 'GPIO_ACTIVE_HIGH';
    const colFlags = matrix.diodeDirection === 'row2col' ? inputFlags : 'GPIO_ACTIVE_HIGH';
    const lists =
      matrix.kind === 'direct'
        ? `    input-gpios = ${scan.colPins.map((pin) => `<&${target.connector} ${pin} (GPIO_ACTIVE_LOW | GPIO_PULL_UP)>`).join(', ')};`
        : `    row-gpios = ${scan.rowPins.map((pin) => `<&${target.connector} ${pin} ${rowFlags}>`).join(', ')};\n    col-gpios = ${scan.colPins.map((pin) => `<&${target.connector} ${pin} ${colFlags}>`).join(', ')};`;
    const offset =
      half === 'right'
        ? `\n&default_transform {\n    col-offset = <${matrix.halves.left.colPins.length}>;\n};\n`
        : '';
    files.push({
      path: `${base}_${half}.overlay`,
      content: `#include "${name}.dtsi"\n\n&kscan0 {\n${lists}\n};\n${offset}`,
    });
  }
  return files;
}
