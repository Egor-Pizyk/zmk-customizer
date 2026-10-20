import type { Project } from '@domain';
import { PROJECT_BUDGET } from './project-budget';

/** Keep readable files normally; whitespace must not make a lossless migration exceed budget. */
export function getProjectJson(project: Project): string {
  const pretty = `${JSON.stringify(project, undefined, 2)}\n`;
  return new TextEncoder().encode(pretty).length <= PROJECT_BUDGET.bytes
    ? pretty
    : `${JSON.stringify(project)}\n`;
}
