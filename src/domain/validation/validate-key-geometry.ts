import { getKeyGeometry } from '../geometry/get-key-geometry';
import type { Project, ValidationIssue } from '../types';

export function validateKeyGeometry(
  project: Project,
  limits: { readonly minLayoutCell: number; readonly maxLayoutCell: number },
): readonly ValidationIssue[] {
  return project.keys.flatMap((key, keyIndex) => {
    const geometry = getKeyGeometry(key);
    const isOutOfRange = Object.values(geometry).some((value) => {
      const cell = Math.round(value * 100);
      return !Number.isFinite(cell) || cell < limits.minLayoutCell || cell > limits.maxLayoutCell;
    });
    if (
      !isOutOfRange &&
      Math.round(geometry.widthU * 100) > 0 &&
      Math.round(geometry.heightU * 100) > 0
    ) {
      return [];
    }
    return [
      {
        code: 'physical-layout-out-of-range' as const,
        message: `Key ${keyIndex} has invalid physical geometry. Use positive size cells and keep position, size, angle and origin within ZMK's signed 16-bit range (${limits.minLayoutCell / 100} to ${limits.maxLayoutCell / 100}). Edit it in Schematic.`,
        path: ['keys', keyIndex],
      },
    ];
  });
}
