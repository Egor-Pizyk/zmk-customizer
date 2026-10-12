import { validateControllerBindings } from './validate-controller-bindings';
import { validateControllerPins } from './validate-controller-pins';
import { deriveShieldMatrix } from './derive-shield-matrix';
import type { ShieldTarget } from './derive-shield-matrix';
import { toLayerNodeName } from './to-layer-node-name';
import type { ControllerBoard, Project, ValidationIssue } from './types';
import { validateProject } from './validate-project';
import type { BindingsCatalog } from './validate-bindings';

function validateNames(project: Project): ValidationIssue[] {
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
    if (toLayerNodeName(layer.name).length > 31) {
      issues.push({
        code: 'layer-node-name-too-long',
        message: `Layer ${layerIndex} becomes a node name longer than 31 characters. Shorten it in Bindings.`,
        path: ['layers', layerIndex, 'name'],
      });
    }
    if (new TextEncoder().encode(layer.name).length > 19) {
      issues.push({
        code: 'layer-display-name-too-long',
        message: `Layer ${layerIndex} exceeds 19 UTF-8 bytes. Shorten its name in Bindings.`,
        path: ['layers', layerIndex, 'name'],
      });
    }
  }
  return issues;
}

function validatePhysicalLayout(project: Project): ValidationIssue[] {
  return project.keys.flatMap((key, keyIndex) => {
    const cells = [key.xU, key.yU].map((value) => Math.round(value * 100));
    return cells.some((cell) => !Number.isFinite(cell) || cell < -32_768 || cell > 32_767)
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
  },
): readonly ValidationIssue[] {
  const matrix = deriveShieldMatrix(project, input.target);
  const issues = [
    ...validateProject(project, input.bindingsCatalog),
    ...validateNames(project),
    ...validateControllerPins(project, input.board),
    ...validateControllerBindings(project, input.board),
    ...validatePhysicalLayout(project),
    ...(matrix.ok ? [] : matrix.error),
  ];
  return issues.filter(
    (issue, index) =>
      issues.findIndex(
        (other) => other.code === issue.code && other.path.join('.') === issue.path.join('.'),
      ) === index,
  );
}
