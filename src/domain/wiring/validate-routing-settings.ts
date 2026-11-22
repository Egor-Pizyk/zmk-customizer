import { roundU } from '@domain/geometry';
import { PROJECT_BUDGET } from '@domain/project';
import type { Project, RoutingSettings, RoutingTargetCell, ValidationIssue } from '@domain';

type Input = {
  readonly settings: RoutingSettings;
  readonly limits: { readonly minLayoutCell: number; readonly maxLayoutCell: number };
};

export function validateRoutingSettings(
  project: Project,
  { settings, limits }: Input,
): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const maxDistanceU = (limits.maxLayoutCell - limits.minLayoutCell) / 100;
  for (const field of ['offsetU', 'clearanceU', 'fallbackRowIntervalU'] as const) {
    const value = settings[field];
    if (!Number.isFinite(value) || roundU(value) <= 0 || value > maxDistanceU) {
      issues.push({
        code: 'routing-settings-invalid',
        message: 'Use a positive routing distance within the supported layout range.',
        path: ['routing', field],
      });
    }
  }
  const axis = settings.mirrorAxisXU;
  if (
    axis !== undefined &&
    (!Number.isFinite(axis) ||
      axis < limits.minLayoutCell / 100 ||
      axis > limits.maxLayoutCell / 100)
  ) {
    issues.push({
      code: 'routing-settings-invalid',
      message: 'Choose a mirror axis within the supported layout range.',
      path: ['routing', 'mirrorAxisXU'],
    });
  }
  if ((settings.targetCells?.length ?? 0) > PROJECT_BUDGET.keys) {
    issues.push({
      code: 'routing-settings-invalid',
      message: 'Reduce the number of desired key assignments.',
      path: ['routing', 'targetCells'],
    });
  }
  return [...issues, ...findTargetIssues(project, settings)];
}

function findTargetIssues(project: Project, settings: RoutingSettings): ValidationIssue[] {
  const seenKeys = new Set<string>();
  const seenCells = new Set<string>();
  const issues: ValidationIssue[] = [];
  for (const [index, cell] of (settings.targetCells ?? []).entries()) {
    const key = project.keys.find((entry) => entry.id === cell.keyId);
    const path = ['routing', 'targetCells', index];
    if (key === undefined || seenKeys.has(cell.keyId)) {
      issues.push({
        code: 'routing-settings-invalid',
        message: 'Choose an existing key once per desired assignment.',
        path: [...path, 'keyId'],
      });
    }
    if (key !== undefined && (key.half ?? 'left') !== cell.half) {
      issues.push({
        code: 'routing-settings-invalid',
        message: 'Use the key’s half for its desired assignment.',
        path: [...path, 'half'],
      });
    }
    issues.push(...findIndexIssues(cell, index));
    const cellId = `${cell.half}:${cell.row}:${cell.col}`;
    if (seenCells.has(cellId)) {
      issues.push({
        code: 'routing-cell-conflict',
        message:
          'Two desired assignments use the same matrix cell. Choose a different row or column.',
        path,
      });
    }
    seenKeys.add(cell.keyId);
    seenCells.add(cellId);
  }
  return issues;
}

function findIndexIssues(cell: RoutingTargetCell, index: number): ValidationIssue[] {
  return (['row', 'col'] as const)
    .filter((field) => !Number.isInteger(cell[field]) || cell[field] < 0 || cell[field] > 254)
    .map((field) => ({
      code: 'routing-settings-invalid',
      message: 'Use a matrix index from 0 through 254.',
      path: ['routing', 'targetCells', index, field],
    }));
}
