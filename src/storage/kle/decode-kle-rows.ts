import type { KeyGeometry, Result } from '@domain';
import { PROJECT_BUDGET } from '@domain/project';
import { applyKleProperties, getKlePropertyWarnings } from './apply-kle-properties';
import type { KleCursor } from './apply-kle-properties';
import type { KleRows } from './kle-schema';

export type KleLayout = {
  readonly geometries: readonly KeyGeometry[];
  readonly warnings: readonly string[];
};
type DecodeOutput = { readonly geometries: KeyGeometry[]; readonly warnings: Set<string> };

export function decodeKleRows(rows: KleRows): Result<KleLayout, string> {
  let cursor: KleCursor = {
    xU: 0,
    yU: 0,
    widthU: 1,
    heightU: 1,
    rotationDeg: 0,
    rotationOriginXU: 0,
    rotationOriginYU: 0,
    isDecal: false,
  };
  const output: DecodeOutput = { geometries: [], warnings: new Set() };
  for (const [rowIndex, row] of rows.entries()) {
    if (!Array.isArray(row)) {
      if (rowIndex !== 0) {
        return { ok: false, error: `KLE metadata must be first (row ${rowIndex + 1}).` };
      }
      output.warnings.add(
        'KLE metadata is ignored; the current project name and controller are retained.',
      );
      continue;
    }
    const result = decodeRow(cursor, { row, rowIndex, output });
    if (!result.ok) {
      return result;
    }
    cursor = { ...result.value, xU: result.value.rotationOriginXU, yU: result.value.yU + 1 };
  }
  if (output.geometries.length === 0) {
    return { ok: false, error: 'The KLE file contains no physical keys.' };
  }
  return { ok: true, value: { geometries: output.geometries, warnings: [...output.warnings] } };
}

function decodeRow(
  initial: KleCursor,
  input: {
    readonly row: Extract<KleRows[number], readonly unknown[]>;
    readonly rowIndex: number;
    readonly output: DecodeOutput;
  },
): Result<KleCursor, string> {
  let cursor = initial;
  for (const [entryIndex, entry] of input.row.entries()) {
    const location = `row ${input.rowIndex + 1}, entry ${entryIndex + 1}`;
    if (typeof entry !== 'string') {
      if (
        entryIndex !== 0 &&
        (entry.r !== undefined || entry.rx !== undefined || entry.ry !== undefined)
      ) {
        return {
          ok: false,
          error: `KLE rotation properties must be first in the row (${location}).`,
        };
      }
      cursor = applyKleProperties(cursor, entry);
      for (const warning of getKlePropertyWarnings(entry)) {
        input.output.warnings.add(warning);
      }
      continue;
    }
    const error = appendKey(cursor, { legend: entry, location, output: input.output });
    if (error !== undefined) {
      return { ok: false, error };
    }
    cursor = { ...cursor, xU: cursor.xU + cursor.widthU, widthU: 1, heightU: 1, isDecal: false };
  }
  return { ok: true, value: cursor };
}

function appendKey(
  cursor: KleCursor,
  input: { readonly legend: string; readonly location: string; readonly output: DecodeOutput },
): string | undefined {
  const { isDecal, ...geometry } = cursor;
  if (!Object.values(geometry).every((value) => Number.isFinite(value))) {
    return `KLE geometry is not finite (${input.location}).`;
  }
  if (isDecal) {
    input.output.warnings.add('Decals are skipped because they are not physical keys.');
  }
  if (!isDecal) {
    input.output.geometries.push(geometry);
  }
  if (input.output.geometries.length > PROJECT_BUDGET.keys) {
    return `A KLE layout may contain at most ${PROJECT_BUDGET.keys} physical keys.`;
  }
  if (input.legend.length > 0) {
    input.output.warnings.add('KLE legends are ignored; no actions are assigned.');
  }
  return undefined;
}
