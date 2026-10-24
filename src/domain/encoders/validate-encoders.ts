import { getEncoderGeometry } from '@domain/geometry';
import { getEncoderConnections } from './get-encoder-connections';
import type { ControllerBoard, Encoder, Project, ValidationIssue } from '@domain';
import { getWireHalf } from '@domain/wiring';
import { validateAdvancedBinding } from '@domain/advanced-keymap';
import type { BindingsCatalog } from '@domain/validation';

function isValidCount(input: { readonly value: number; readonly maximum: number }): boolean {
  return Number.isInteger(input.value) && input.value >= 1 && input.value <= input.maximum;
}

function getUsedPins(project: Project): ReadonlySet<string> {
  const pins = new Set<string>();
  for (const terminal of project.wiring?.terminals ?? []) {
    if (terminal.boardPin !== undefined && terminal.kind !== 'ground') {
      pins.add(`${terminal.half}:${terminal.boardPin}`);
    }
  }
  for (const wire of project.wires) {
    for (const end of [wire.start, wire.end]) {
      if (end.kind === 'free' && end.boardPin !== undefined) {
        pins.add(`${getWireHalf(project, wire)}:${end.boardPin}`);
      }
    }
  }
  return pins;
}

type HardwareInput = {
  readonly encoder: Encoder;
  readonly index: number;
  readonly board: ControllerBoard;
  readonly catalog: BindingsCatalog;
  readonly usedPins: ReadonlySet<string>;
};
function createIssue(
  input: HardwareInput,
  value: {
    readonly code: ValidationIssue['code'];
    readonly property: string;
    readonly message: string;
  },
): ValidationIssue {
  return {
    code: value.code,
    path: ['encoders', input.index, value.property],
    message: `Encoder ${input.index}: ${value.message}`,
  };
}
function validateHardware(project: Project, input: HardwareInput): readonly ValidationIssue[] {
  return [
    ...validateProperties(project, input),
    ...(input.encoder.wiringMode === 'schematic'
      ? validateSchematicPins(project, input)
      : validatePins(project, input)),
  ];
}
function validateProperties(project: Project, input: HardwareInput): readonly ValidationIssue[] {
  const { encoder, catalog } = input;
  const issues: ValidationIssue[] = [];
  for (const property of ['steps', 'triggersPerRotation'] as const) {
    const maximum =
      property === 'steps' ? catalog.encoderLimits.maxSteps : catalog.encoderLimits.maxTriggers;
    const hasExactRate =
      property === 'steps' || catalog.encoderLimits.rotationDegrees % encoder[property] === 0;
    if (!isValidCount({ value: encoder[property], maximum }) || !hasExactRate) {
      issues.push(
        createIssue(input, {
          code: 'encoder-invalid',
          property,
          message:
            property === 'steps'
              ? `electrical steps must be a whole number from 1 to ${maximum} for ZMK v0.3.`
              : `triggers per rotation must be a positive divisor of ${catalog.encoderLimits.rotationDegrees} for exact ZMK v0.3 timing.`,
        }),
      );
    }
  }
  if (encoder.half === 'right' && project.wiring?.topology !== 'split') {
    issues.push(
      createIssue(input, {
        code: 'encoder-invalid',
        property: 'half',
        message: 'choose the left half for a unibody keyboard or enable split wiring.',
      }),
    );
  }
  return [...issues, ...validatePositions(project, input)];
}
function validatePositions(project: Project, input: HardwareInput): readonly ValidationIssue[] {
  const { encoder, catalog } = input;
  const issues: ValidationIssue[] = [];
  for (const property of ['xU', 'yU'] as const) {
    const value = getEncoderGeometry(project, encoder)[property] * 100;
    if (
      !Number.isFinite(value) ||
      value < catalog.shieldLimits.minLayoutCell ||
      value > catalog.shieldLimits.maxLayoutCell
    ) {
      issues.push(
        createIssue(input, {
          code: 'encoder-invalid',
          property,
          message: `position is outside the supported physical layout. Enter a position from ${catalog.shieldLimits.minLayoutCell / 100}u to ${catalog.shieldLimits.maxLayoutCell / 100}u.`,
        }),
      );
    }
  }
  return issues;
}
function validatePins(project: Project, input: HardwareInput): readonly ValidationIssue[] {
  const { encoder, board, usedPins } = input;
  const issues: ValidationIssue[] = [];
  for (const property of ['aPin', 'bPin'] as const) {
    const pin = encoder[property];
    if (pin === undefined) {
      issues.push(
        createIssue(input, {
          code: 'encoder-pin-missing',
          property,
          message: `assign ${property === 'aPin' ? 'A' : 'B'} to a controller GPIO pin.`,
        }),
      );
      continue;
    }
    if (!board.gpioPins.includes(pin)) {
      issues.push(
        createIssue(input, {
          code: 'encoder-invalid',
          property,
          message: `pin D${pin} is unavailable on ${board.name}. Choose an available GPIO pin.`,
        }),
      );
    }
    if (
      usedPins.has(`${encoder.half}:${pin}`) ||
      hasEncoderConflict(project, { encoder, pin, property })
    ) {
      issues.push(
        createIssue(input, {
          code: 'encoder-pin-conflict',
          property,
          message: `pin D${pin} is already used on the ${encoder.half} half. Choose a separate GPIO pin.`,
        }),
      );
    }
  }
  return issues;
}

function hasEncoderConflict(
  project: Project,
  input: {
    readonly encoder: Encoder;
    readonly pin: number;
    readonly property: 'aPin' | 'bPin';
  },
): boolean {
  return project.encoders.some((other) => {
    if (other.wiringMode === 'schematic' || other.half !== input.encoder.half) {
      return false;
    }
    if (other.id === input.encoder.id) {
      return other[input.property === 'aPin' ? 'bPin' : 'aPin'] === input.pin;
    }
    return other.aPin === input.pin || other.bPin === input.pin;
  });
}

export function validateEncoders(
  project: Project,
  input: {
    readonly board: ControllerBoard;
    readonly catalog: BindingsCatalog;
  },
): readonly ValidationIssue[] {
  const usedPins = getUsedPins(project);
  return [
    ...project.encoders.flatMap((encoder, index) =>
      validateHardware(project, { ...input, encoder, index, usedPins }),
    ),
    ...project.layers.flatMap((layer, layerIndex) =>
      project.encoders.flatMap((encoder, index) => {
        const binding = layer.encoderBindings?.[encoder.id];
        if (binding === undefined) {
          return [];
        }
        return (['clockwise', 'counterclockwise'] as const).flatMap((direction) =>
          validateAdvancedBinding(project, binding[direction], {
            catalog: input.catalog,
            path: ['layers', layerIndex, 'encoderBindings', encoder.id, direction],
            label: `Encoder ${index} ${direction} on layer ${layer.name}`,
          }),
        );
      }),
    ),
  ];
}

function validateSchematicPins(project: Project, input: HardwareInput): readonly ValidationIssue[] {
  const connections = getEncoderConnections(project, input.encoder);
  const issues = (['aPin', 'bPin'] as const).flatMap((property) =>
    validateSchematicChannel(project, input, { property, value: connections[property] }),
  );
  if (!connections.hasGround) {
    issues.push(
      createIssue(input, {
        code: 'encoder-pin-missing',
        property: 'wiringMode',
        message: 'connect COM to GND on the same half.',
      }),
    );
  }
  if (connections.hasConflict) {
    issues.push(
      createIssue(input, {
        code: 'encoder-pin-conflict',
        property: 'wiringMode',
        message:
          'keep A and B on separate GPIO-only nets, COM on ground, and all contacts on their own half.',
      }),
    );
  }
  return issues;
}

function hasLegacyPinConflict(project: Project, encoder: Encoder, pin: number): boolean {
  return project.encoders.some(
    (other) =>
      other.id !== encoder.id &&
      other.half === encoder.half &&
      other.wiringMode !== 'schematic' &&
      (other.aPin === pin || other.bPin === pin),
  );
}

function validateSchematicChannel(
  project: Project,
  input: HardwareInput,
  channel: { readonly property: 'aPin' | 'bPin'; readonly value: number | undefined },
): ValidationIssue[] {
  const { property, value } = channel;
  if (value === undefined || !input.board.gpioPins.includes(value)) {
    return [
      createIssue(input, {
        code: 'encoder-pin-missing',
        property,
        message: `connect ${property === 'aPin' ? 'A' : 'B'} through a wire to one available controller GPIO.`,
      }),
    ];
  }
  return hasLegacyPinConflict(project, input.encoder, value)
    ? [
        createIssue(input, {
          code: 'encoder-pin-conflict',
          property,
          message: 'GPIO is used by another encoder. Choose a separate pin.',
        }),
      ]
    : [];
}
