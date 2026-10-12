import { validateSchematic } from './validate-schematic';
import type { Net } from './get-nets';
import type { ShieldMatrix, ShieldTarget } from './derive-shield-matrix';
import { validateControllerBindings } from './validate-controller-bindings';
import { validateControllerPins } from './validate-controller-pins';
import { deriveShieldMatrix } from './derive-shield-matrix';
import { toLayerNodeName } from './to-layer-node-name';
import type { ControllerBoard, Project, Result, ValidationIssue } from './types';
import { validateProject } from './validate-project';
import type { BindingsCatalog } from './validate-bindings';

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

function validatePhysicalLayout(
  project: Project,
  limits: BindingsCatalog['shieldLimits'],
): ValidationIssue[] {
  return project.keys.flatMap((key, keyIndex) => {
    const cells = [key.xU, key.yU].map((value) => Math.round(value * 100));
    return cells.some(
      (cell) =>
        !Number.isFinite(cell) || cell < limits.minLayoutCell || cell > limits.maxLayoutCell,
    )
      ? [
          {
            code: 'physical-layout-out-of-range' as const,
            message: `Key ${keyIndex} is outside ZMK's signed 16-bit layout range. Move it between -327.68u and 327.67u in Schematic.`,
            path: ['keys', keyIndex],
          },
        ]
      : [];
  });
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
    ...validatePhysicalLayout(project, input.bindingsCatalog.shieldLimits),
    ...(matrix.ok ? [] : matrix.error),
  ];
  return issues.filter(
    (issue, index) =>
      issues.findIndex(
        (other) => other.code === issue.code && other.path.join('.') === issue.path.join('.'),
      ) === index,
  );
}
