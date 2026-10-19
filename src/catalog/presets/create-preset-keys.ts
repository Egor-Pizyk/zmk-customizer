import type { PresetLayoutKey } from '@domain/project';
import type { Half } from '@domain';

type PresetKeyTuple = readonly [
  keycode: string,
  xU: number,
  yU: number,
  widthU?: number,
  heightU?: number,
  rotationDeg?: number,
  rotationOriginXU?: number,
  rotationOriginYU?: number,
  half?: Half,
];

// Compact authored geometry data; source provenance is in spec 031 research.md.
export function createPresetKeys(tuples: readonly PresetKeyTuple[]): readonly PresetLayoutKey[] {
  return tuples.map(
    ([
      keycode,
      xU,
      yU,
      widthU,
      heightU,
      rotationDeg,
      rotationOriginXU,
      rotationOriginYU,
      half,
    ]) => ({
      keycode,
      xU,
      yU,
      ...(widthU === undefined ? {} : { widthU }),
      ...(heightU === undefined ? {} : { heightU }),
      ...(rotationDeg === undefined ? {} : { rotationDeg }),
      ...(rotationOriginXU === undefined ? {} : { rotationOriginXU }),
      ...(rotationOriginYU === undefined ? {} : { rotationOriginYU }),
      ...(half === undefined ? {} : { half }),
    }),
  );
}
