import type { z } from 'zod';
import type { Result } from '@domain';
import { PROJECT_BUDGET } from '@domain/project';
import { kleLayoutSchema } from './kle-schema';
import { decodeKleRows } from './decode-kle-rows';
import type { KleLayout } from './decode-kle-rows';

export function parseKleLayout(text: string): Result<KleLayout, string> {
  if (new TextEncoder().encode(text).length > PROJECT_BUDGET.bytes) {
    return { ok: false, error: 'The KLE file exceeds the 5 MiB limit.' };
  }
  const json = parseJson(text);
  if (!json.ok) {
    return json;
  }
  const parsed = kleLayoutSchema.safeParse(json.value);
  if (!parsed.success) {
    return { ok: false, error: formatShapeError(findIssuePath(parsed.error.issues)) };
  }
  return decodeKleRows(parsed.data);
}

function parseJson(text: string): Result<unknown, string> {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      error:
        'Choose a downloaded KLE JSON file with an outer array. Raw editor text is not supported.',
    };
  }
}

function formatShapeError(path: readonly PropertyKey[]): string {
  const [rowIndex, entryIndex] = path;
  const row = typeof rowIndex === 'number' ? ` at row ${rowIndex + 1}` : '';
  const entry = typeof entryIndex === 'number' ? `, entry ${entryIndex + 1}` : '';
  return `Invalid KLE layout${row}${entry}. Use row arrays with string keys and finite numeric geometry; width and height must be positive.`;
}

function findIssuePath(issues: readonly z.core.$ZodIssue[]): readonly PropertyKey[] {
  let path: readonly PropertyKey[] = [];
  for (const issue of issues) {
    const candidate =
      issue.code === 'invalid_union'
        ? [...issue.path, ...findIssuePath(issue.errors.flat())]
        : issue.path;
    if (candidate.length > path.length) {
      path = candidate;
    }
  }
  return path;
}
