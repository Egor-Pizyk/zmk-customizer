import { FIRMWARE_OPTIONS } from '@catalog/firmware';
import { BINDINGS_CATALOG } from '@catalog/bindings';
import { getControllerBoard } from '@catalog/controllers';
import { analyzeProject } from '@domain/analysis';
import type { Project, ValidationIssue } from '@domain';

// Validation cache (perf): one commit ran validateProject 3 times (before + after here,
// plus the provider's useMemo on the same after object). Projects are immutable and shared
// by reference through history, so a WeakMap keeps exactly one real run per new project.
const analysisByProject = new WeakMap<Project, ReturnType<typeof analyzeProject>>();

export function getProjectAnalysis(project: Project): ReturnType<typeof analyzeProject> {
  const cached = analysisByProject.get(project);
  if (cached !== undefined) {
    return cached;
  }
  const board = getControllerBoard(project.controllerId);
  const analysis = analyzeProject(project, {
    bindingsCatalog: BINDINGS_CATALOG,
    firmwareOptions: FIRMWARE_OPTIONS,
    target: { ...board, boardId: board.id },
    board,
  });
  analysisByProject.set(project, analysis);
  return analysis;
}

export function getValidationIssues(project: Project): readonly ValidationIssue[] {
  return getProjectAnalysis(project).issues;
}
