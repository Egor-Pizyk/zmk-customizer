import { expect, it } from 'vitest';
import type { ValidationIssue } from '@domain';
import { toIssueTargetPreferences, toWorkspaceIssues } from '@ui/issues';

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

it('opens the workspace that fixes an issue, the parts list or the issue layer (spec 007 R6)', () => {
  const issues = toWorkspaceIssues([
    { code: 'key-overlap', message: 'a', path: ['keys', 1] },
    { code: 'binding-keycode-unknown', message: 'b', path: ['layers', 2, 'bindings', 'k1'] },
    { code: 'layer-name-empty', message: 'c', path: ['layers', 3, 'name'] },
    { code: 'shield-name-empty', message: 'd', path: ['name'] },
  ]);
  expect(issues.map((issue) => toIssueTargetPreferences(issue))).toEqual([
    { activeWorkspaceId: 'schematic', isPartsListOpen: true },
    { activeWorkspaceId: 'bindings', bindingsLayerIndex: 2 },
    { activeWorkspaceId: 'bindings', bindingsLayerIndex: 3 },
    { activeWorkspaceId: 'schematic', isPartsListOpen: true },
  ]);
});
