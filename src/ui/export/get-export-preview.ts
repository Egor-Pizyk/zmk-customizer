import { getControllerBoard } from '@catalog/controllers';
import { SHIELD_TARGET } from '@catalog/firmware';
import type { analyzeProject } from '@domain';
import { getShieldName } from '@domain';
import { generateRepositoryFiles } from '@generators';
import { toWorkspaceIssues } from '@ui/issues';

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
