import type { Result } from '@domain';

type PublicationFile = {
  readonly path: string;
  readonly content: string;
  readonly oid: string;
};

type TreeEntry = {
  readonly path: string;
  readonly sha: string;
  readonly mode: string;
};

export type PublicationChange = PublicationFile & { readonly change: 'add' | 'replace' };

const BUILD_WORKFLOW = '.github/workflows/build.yml';
const WORKFLOW_PATH = /^\.github\/workflows\/[^/]+\.ya?ml$/u;

export function planPublication(
  files: readonly PublicationFile[],
  entries: readonly TreeEntry[],
  useGeneratedWorkflow: boolean,
): Result<readonly PublicationChange[], string> {
  const entryByPath = new Map(entries.map((entry) => [entry.path, entry]));
  const hasWorkflow = entries.some((entry) => WORKFLOW_PATH.test(entry.path));
  const changes: PublicationChange[] = [];
  for (const file of files) {
    if (file.path === BUILD_WORKFLOW && hasWorkflow && !useGeneratedWorkflow) {
      continue;
    }
    const existing = entryByPath.get(file.path);
    if (existing !== undefined && existing.mode !== '100644' && existing.mode !== '100755') {
      return { ok: false, error: file.path };
    }
    const directories = file.path.split('/').slice(0, -1);
    for (const [index] of directories.entries()) {
      const path = directories.slice(0, index + 1).join('/');
      const entry = entryByPath.get(path);
      if (entry !== undefined && entry.mode !== '040000') {
        return { ok: false, error: path };
      }
    }
    if (existing?.sha !== file.oid) {
      changes.push({ ...file, change: existing === undefined ? 'add' : 'replace' });
    }
  }
  return { ok: true, value: changes };
}
