import type { WorkspaceIssue } from '@ui/issues';

// Binding issues sit at ['layers', L, 'bindings', keyId] (spec 004 contracts/validation-issues.md);
// keycaps and the Keys table show the open layer's only (spec 007 FR-007).
export function getProblemsByKeyId(
  issues: readonly WorkspaceIssue[],
  input: { readonly layerIndex: number },
): ReadonlyMap<string, readonly string[]> {
  const problemsByKeyId = new Map<string, string[]>();
  for (const issue of issues) {
    const [collection, layerIndex, part, keyId] = issue.path;
    if (
      collection !== 'layers' ||
      layerIndex !== input.layerIndex ||
      part !== 'bindings' ||
      typeof keyId !== 'string'
    ) {
      continue;
    }
    problemsByKeyId.set(keyId, [...(problemsByKeyId.get(keyId) ?? []), issue.message]);
  }
  return problemsByKeyId;
}
