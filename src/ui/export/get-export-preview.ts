import { getControllerBoard } from '../../catalog/get-controller-board';
import { SHIELD_TARGET } from '../../catalog/shield-target';
import { deriveShieldMatrix } from '../../domain/derive-shield-matrix';
import { getShieldName } from '../../domain/get-shield-name';
import type { Project } from '../../domain/types';
import { generateRepositoryFiles } from '../../generators/generate-repository-files';
import { toWorkspaceIssues } from '../shell/workspace-issue';
import type { WorkspaceIssue } from '../shell/workspace-issue';

export function getExportPreview(
  project: Project,
  input: {
    readonly issues: readonly WorkspaceIssue[];
    readonly includeWorkflow: boolean;
  },
) {
  const board = getControllerBoard(project.controllerId);
  const target = { ...SHIELD_TARGET, ...board, boardId: board.id };
  const matrix = input.issues.length === 0 ? deriveShieldMatrix(project, target) : undefined;
  const problems = matrix?.ok === false ? toWorkspaceIssues(matrix.error) : input.issues;
  const files =
    matrix?.ok === true
      ? generateRepositoryFiles(project, {
          matrix: matrix.value,
          target,
          includeWorkflow: input.includeWorkflow,
        })
      : [];
  return { files, problems, shieldName: getShieldName(project) };
}
