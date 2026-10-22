import { getEncoderOutputPins } from '@domain/encoders';
import type { ControllerBoard, Project } from '@domain';

export function renderEncoderHardware(
  project: Project,
  target: Pick<ControllerBoard, 'connector'>,
): string {
  if (project.encoders.length === 0) {
    return '';
  }
  const status = project.wiring?.topology === 'split' ? 'disabled' : 'okay';
  const nodes = project.encoders
    .map(
      (encoder, index) => `
    encoder_${index}: encoder_${index} {
        compatible = "alps,ec11";
        a-gpios = <&${target.connector} ${getEncoderOutputPins(project, encoder).aPin} (GPIO_ACTIVE_HIGH | GPIO_PULL_UP)>;
        b-gpios = <&${target.connector} ${getEncoderOutputPins(project, encoder).bPin} (GPIO_ACTIVE_HIGH | GPIO_PULL_UP)>;
        steps = <${encoder.steps}>;
        status = "${status}";
    };`,
    )
    .join('\n');
  const configs = project.encoders
    .map(
      (encoder, index) => `        encoder_config_${index} {
            triggers-per-rotation = <${encoder.triggersPerRotation}>;
        };`,
    )
    .join('\n');
  return `${nodes}

    sensors: sensors {
        compatible = "zmk,keymap-sensors";
        sensors = <${project.encoders.map((_, index) => `&encoder_${index}`).join(' ')}>;
${configs}
    };
`;
}
