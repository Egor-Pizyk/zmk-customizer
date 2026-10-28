import { roundU } from '@domain/geometry';
import { validateRoutingSettings } from '@domain/wiring';
import type { Project, Result, RoutingSettings, ValidationIssue } from '@domain';

type Input = {
  readonly settings: RoutingSettings;
  readonly limits: { readonly minLayoutCell: number; readonly maxLayoutCell: number };
};

export function setRoutingSettings(
  project: Project,
  input: Input,
): Result<Project, readonly ValidationIssue[]> {
  const issues = validateRoutingSettings(project, input).filter(
    (issue) => issue.code !== 'routing-cell-conflict',
  );
  if (issues.length > 0) {
    return { ok: false, error: issues };
  }
  const routing = normalize(input.settings);
  const previous = project.routing === undefined ? undefined : normalize(project.routing);
  return {
    ok: true,
    value: JSON.stringify(previous) === JSON.stringify(routing) ? project : { ...project, routing },
  };
}

function normalize(settings: RoutingSettings): RoutingSettings {
  return {
    matrixStyle: settings.matrixStyle,
    offsetU: roundU(settings.offsetU),
    clearanceU: roundU(settings.clearanceU),
    fallbackRowIntervalU: roundU(settings.fallbackRowIntervalU),
    ...(settings.mirrorAxisXU === undefined ? {} : { mirrorAxisXU: roundU(settings.mirrorAxisXU) }),
    preferredScope: settings.preferredScope,
    ...(settings.preferredHalf === undefined ? {} : { preferredHalf: settings.preferredHalf }),
    ...(settings.rowPin === undefined ? {} : { rowPin: settings.rowPin }),
    ...(settings.diodeSide === undefined ? {} : { diodeSide: settings.diodeSide }),
    ...(settings.targetCells === undefined
      ? {}
      : {
          targetCells: settings.targetCells.map((cell) => ({
            keyId: cell.keyId,
            half: cell.half,
            row: cell.row,
            col: cell.col,
          })),
        }),
  };
}
