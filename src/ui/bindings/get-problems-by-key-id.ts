import type { WorkspaceIssue } from '../shell/workspace-issue';

// Binding issues sit at ['layers', 0, 'bindings', keyId] (contracts/validation-issues.md).
export function getProblemsByKeyId(
  issues: readonly WorkspaceIssue[],
): ReadonlyMap<string, readonly string[]> {
  const problemsByKeyId = new Map<string, string[]>();
  for (const issue of issues) {
    const [collection, layerIndex, part, keyId] = issue.path;
    if (
      collection !== 'layers' ||
      layerIndex !== 0 ||
      part !== 'bindings' ||
      typeof keyId !== 'string'
    ) {
      continue;
    }
    problemsByKeyId.set(keyId, [...(problemsByKeyId.get(keyId) ?? []), issue.message]);
  }
  return problemsByKeyId;
}
