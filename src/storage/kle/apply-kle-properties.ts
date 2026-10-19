import type { KleProperties } from './kle-schema';

export type KleCursor = {
  readonly xU: number;
  readonly yU: number;
  readonly widthU: number;
  readonly heightU: number;
  readonly rotationDeg: number;
  readonly rotationOriginXU: number;
  readonly rotationOriginYU: number;
  readonly isDecal: boolean;
};

export function applyKleProperties(cursor: KleCursor, properties: KleProperties): KleCursor {
  const rotationOriginXU = properties.rx ?? cursor.rotationOriginXU;
  const rotationOriginYU = properties.ry ?? cursor.rotationOriginYU;
  const hasOrigin = properties.rx !== undefined || properties.ry !== undefined;
  return {
    xU: (hasOrigin ? rotationOriginXU : cursor.xU) + (properties.x ?? 0),
    yU: (hasOrigin ? rotationOriginYU : cursor.yU) + (properties.y ?? 0),
    widthU: properties.w ?? cursor.widthU,
    heightU: properties.h ?? cursor.heightU,
    rotationDeg: properties.r ?? cursor.rotationDeg,
    rotationOriginXU,
    rotationOriginYU,
    isDecal: properties.d ?? cursor.isDecal,
  };
}

export function getKlePropertyWarnings(properties: KleProperties): readonly string[] {
  const supported = new Set(['x', 'y', 'w', 'h', 'r', 'rx', 'ry', 'd']);
  const secondary = new Set(['x2', 'y2', 'w2', 'h2']);
  const warnings: string[] = [];
  for (const name of Object.keys(properties)) {
    if (supported.has(name)) {
      continue;
    }
    if (secondary.has(name)) {
      warnings.push('Secondary key shapes are approximated by their primary rectangle.');
      continue;
    }
    warnings.push(
      `Ignored KLE property: ${name}. Appearance and unsupported properties are not imported.`,
    );
  }
  return warnings;
}
