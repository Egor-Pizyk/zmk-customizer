import {
  validateKeyGeometry,
  validateSchematic,
  validateControllerBindings,
  validateControllerPins,
  validateProject,
} from '@domain/validation';
import type { BindingsCatalog } from '@domain/validation';
import type { Net } from '@domain/wires/nets';
import { deriveShieldMatrix } from '@domain/wiring/matrix';
import type { ShieldMatrix, ShieldTarget } from '@domain/wiring/matrix';
import { toLayerNodeName } from '@domain/layers';
import type { ControllerBoard, Project, Result, ValidationIssue } from '@domain';

function validateNames(
  project: Project,
  limits: BindingsCatalog['shieldLimits'],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (/[\p{Cc}]/u.test(project.name) || !project.name.isWellFormed()) {
    issues.push({
      code: 'keyboard-name-unsafe',
      message:
        'The keyboard name contains a control character or broken Unicode. Remove it from Name.',
      path: ['name'],
    });
  }
  for (const [layerIndex, layer] of project.layers.entries()) {
    if (!layer.name.isWellFormed()) {
      issues.push({
        code: 'layer-name-invalid-character',
        message: `Layer ${layerIndex} contains broken Unicode. Rename it in Bindings.`,
        path: ['layers', layerIndex, 'name'],
      });
    }
    if (toLayerNodeName(layer.name).length > limits.layerNodeNameLength) {
      issues.push({
        code: 'layer-node-name-too-long',
        message: `Layer ${layerIndex} becomes a node name longer than ${limits.layerNodeNameLength} characters. Shorten it in Bindings.`,
        path: ['layers', layerIndex, 'name'],
      });
    }
    if (new TextEncoder().encode(layer.name).length > limits.layerDisplayNameBytes) {
      issues.push({
        code: 'layer-display-name-too-long',
        message: `Layer ${layerIndex} exceeds ${limits.layerDisplayNameBytes} UTF-8 bytes. Shorten its name in Bindings.`,
        path: ['layers', layerIndex, 'name'],
      });
    }
  }
  return issues;
}

export function validateShieldProject(
  project: Project,
  input: {
    readonly bindingsCatalog: BindingsCatalog;
    readonly target: ShieldTarget;
    readonly board: ControllerBoard;
    readonly nets?: readonly Net[];
    readonly schematicIssues?: readonly ValidationIssue[];
    readonly matrix?: Result<ShieldMatrix, readonly ValidationIssue[]>;
  },
): readonly ValidationIssue[] {
  const schematicIssues = input.schematicIssues ?? validateSchematic(project, input.nets);
  const matrix =
    input.matrix ??
    deriveShieldMatrix(project, input.target, { nets: input.nets, schematicIssues });
  const issues = [
    ...validateProject(project, input.bindingsCatalog, schematicIssues),
    ...validateNames(project, input.bindingsCatalog.shieldLimits),
    ...validateControllerPins(project, input.board),
    ...validateControllerBindings(project, input.board),
    ...validateKeyGeometry(project, input.bindingsCatalog.shieldLimits),
    ...(matrix.ok ? [] : matrix.error),
    ...(project.wiring?.topology === 'split' && !input.board.ble
      ? [
          {
            code: 'wiring-split-unsupported' as const,
            message: 'Split requires a BLE controller. Select a BLE board.',
            path: ['controllerId'],
          },
        ]
      : []),
  ];
  return issues.filter(
    (issue, index) =>
      issues.findIndex(
        (other) => other.code === issue.code && other.path.join('.') === issue.path.join('.'),
      ) === index,
  );
}
