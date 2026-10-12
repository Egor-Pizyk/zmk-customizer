import { getControllerBoard } from '../../catalog/get-controller-board';
import { SHIELD_TARGET } from '../../catalog/shield-target';
import type { analyzeProject } from '../../domain/analyze-project';
import { getShieldName } from '../../domain/get-shield-name';
import { generateRepositoryFiles } from '../../generators/generate-repository-files';
import { toWorkspaceIssues } from '../shell/workspace-issue';

export function getExportPreview(
  analysis: ReturnType<typeof analyzeProject>,
  input: {
    readonly includeWorkflow: boolean;
  },
) {
  const { project, matrix, issues } = analysis;
  const board = getControllerBoard(project.controllerId);
  const target = { ...SHIELD_TARGET, ...board, boardId: board.id };
  const problems = toWorkspaceIssues(issues);
  const files =
    issues.length === 0 && matrix.ok
      ? generateRepositoryFiles(project, {
          matrix: matrix.value,
          target,
          includeWorkflow: input.includeWorkflow,
        })
      : [];
  return { files, problems, shieldName: getShieldName(project) };
}
