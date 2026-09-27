import { expect, it } from 'vitest';
import type { ValidationIssue } from '../../domain/types';
import { toWorkspaceIssues } from './workspace-issue';

it('puts every project-name issue under Schematic and keeps the order', () => {
  const issues: readonly ValidationIssue[] = [
    { code: 'shield-name-empty', message: 'a', path: ['name'] },
    { code: 'shield-name-invalid', message: 'b', path: ['shieldName'] },
    { code: 'keyboard-name-too-long', message: 'c', path: ['name'] },
  ];
  expect(toWorkspaceIssues(issues).map((issue) => issue.workspaceId)).toEqual([
    'schematic',
    'schematic',
    'schematic',
  ]);
  expect(toWorkspaceIssues(issues).map((issue) => issue.message)).toEqual(['a', 'b', 'c']);
});
