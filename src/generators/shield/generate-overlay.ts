import { renderEncoderHardware } from './render-encoder-hardware';
import { getKeyGeometry } from '@domain/geometry';
import { getShieldName } from '@domain/project';
import type { ShieldMatrix } from '@domain/wiring/matrix';
import type { ControllerBoard, Project } from '@domain';
import { escapeString } from '@generators';
import type { GeneratedFile } from '@generators';

function renderPins(
  pins: readonly number[],
  input: { readonly flags: string; readonly connector: string },
): string {
  return pins.map((pin) => `<&${input.connector} ${pin} ${input.flags}>`).join(', ');
}

function renderKscan(matrix: ShieldMatrix, connector: string): string {
  if (matrix.kind === 'direct') {
    return `    kscan0: kscan_0 {
        compatible = "zmk,kscan-gpio-direct";
        wakeup-source;
        input-gpios = ${renderPins(matrix.halves?.left.colPins ?? matrix.colPins, { flags: '(GPIO_ACTIVE_LOW | GPIO_PULL_UP)', connector })};
    };`;
  }
  const inputFlags = '(GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)';
  const rowFlags = matrix.diodeDirection === 'col2row' ? inputFlags : 'GPIO_ACTIVE_HIGH';
  const colFlags = matrix.diodeDirection === 'row2col' ? inputFlags : 'GPIO_ACTIVE_HIGH';
  return `    kscan0: kscan_0 {
        compatible = "zmk,kscan-gpio-matrix";
        wakeup-source;
        diode-direction = "${matrix.diodeDirection}";
        row-gpios = ${renderPins(matrix.halves?.left.rowPins ?? matrix.rowPins, { flags: rowFlags, connector })};
        col-gpios = ${renderPins(matrix.halves?.left.colPins ?? matrix.colPins, { flags: colFlags, connector })};
    };`;
}

function renderMatrixTransform(matrix: ShieldMatrix): string {
  const cells = matrix.cells.map((cell) => `            RC(${cell.row},${cell.col})`).join('\n');
  return `    default_transform: keymap_transform_0 {
        compatible = "zmk,matrix-transform";
        rows = <${matrix.rowPins.length}>;
        columns = <${matrix.colPins.length}>;
        map = <
${cells}
        >;
    };`;
}

function renderPhysicalCell(valueU: number): string {
  const cell = Math.round(valueU * 100);
  return cell < 0 ? `(${cell})` : String(cell);
}

function renderPhysicalLayout(project: Project): string {
  const keys = project.keys
    .map((key) => {
      const geometry = getKeyGeometry(key);
      const values = [
        geometry.widthU,
        geometry.heightU,
        geometry.xU,
        geometry.yU,
        geometry.rotationDeg,
        geometry.rotationOriginXU,
        geometry.rotationOriginYU,
      ];
      return `<&key_physical_attrs ${values.map((value) => renderPhysicalCell(value)).join(' ')}>`;
    })
    .join(',\n            ');
  return `    default_layout: default_layout {
        compatible = "zmk,physical-layout";
        display-name = "${escapeString(project.name, 'devicetree')}";
        transform = <&default_transform>;
        kscan = <&kscan0>;
        keys = ${keys};
    };`;
}

export function generateOverlay(
  project: Project,
  matrix: ShieldMatrix,
  target: Pick<ControllerBoard, 'connector'>,
): GeneratedFile {
  const shieldName = getShieldName(project);
  return {
    path: `boards/shields/${shieldName}/${shieldName}.overlay`,
    content: `#include <dt-bindings/zmk/matrix_transform.h>
#include <physical_layouts.dtsi>

/ {
    chosen {
        zmk,kscan = &kscan0;
        zmk,physical-layout = &default_layout;
    };

${renderKscan(matrix, target.connector)}

${renderMatrixTransform(matrix)}

${renderPhysicalLayout(project)}
${renderEncoderHardware(project, target)}};
`,
  };
}
