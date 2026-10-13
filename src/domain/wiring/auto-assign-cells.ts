import { getKeyGeometry } from '../geometry/get-key-geometry';
import { rotatePoint } from '../geometry/rotate-point';
import type { Half, Project } from '../types';
import type { WiringCell } from './get-wiring-cells';

export function autoAssignCells(
  project: Project,
  input: {
    readonly gridStepU: number;
    readonly topology: 'unibody' | 'split';
    readonly assignHalves?: boolean;
  },
): readonly WiringCell[] {
  const centers = getCenters(project);
  let minX = Infinity;
  let maxX = -Infinity;
  for (const center of centers) {
    minX = Math.min(minX, center.at.xU);
    maxX = Math.max(maxX, center.at.xU);
  }
  const midX = (minX + maxX) / 2;
  const step = input.gridStepU > 0 && Number.isFinite(input.gridStepU) ? input.gridStepU : 0.25;
  const entries = centers.map((center) => {
    let half: Half = 'left';
    if (input.topology === 'split') {
      half = center.key.half ?? 'left';
      if (input.assignHalves === true) {
        half = center.at.xU > midX ? 'right' : 'left';
      }
    }
    return {
      key: center.key,
      keyIndex: center.keyIndex,
      at: center.at,
      half,
      rowY: Math.round(center.at.yU / step) * step,
    };
  });
  return assignRows(entries);
}

function getCenters(project: Project) {
  return project.keys.map((key, keyIndex) => {
    const geometry = getKeyGeometry(key);
    const at = rotatePoint(
      { xU: key.xU + geometry.widthU / 2, yU: key.yU + geometry.heightU / 2 },
      {
        rotationDeg: geometry.rotationDeg,
        origin: { xU: geometry.rotationOriginXU, yU: geometry.rotationOriginYU },
      },
    );
    return { key, keyIndex, at };
  });
}

function assignRows(
  entries: readonly {
    key: Project['keys'][number];
    keyIndex: number;
    at: { xU: number; yU: number };
    half: Half;
    rowY: number;
  }[],
): readonly WiringCell[] {
  return entries.map((entry) => {
    const ys = [
      ...new Set(entries.filter((other) => other.half === entry.half).map((other) => other.rowY)),
    ].toSorted((first, second) => first - second);
    const row = ys.indexOf(entry.rowY);
    const rowEntries = entries
      .filter((other) => other.half === entry.half && other.rowY === entry.rowY)
      .toSorted((first, second) => first.at.xU - second.at.xU || first.keyIndex - second.keyIndex);
    return {
      keyId: entry.key.id,
      half: entry.half,
      row,
      col: rowEntries.indexOf(entry),
      rowPin: 1,
    };
  });
}
