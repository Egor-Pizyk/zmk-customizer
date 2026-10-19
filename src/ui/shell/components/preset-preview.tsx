import { getKeyCorners } from '@domain/geometry';
import type { PresetLayout } from '@domain/project';

export function PresetPreview({ preset }: { readonly preset: PresetLayout }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p>
        {preset.keys.length} keys ·{' '}
        {preset.topology === 'split' ? 'Split, left and right halves' : 'Unibody'}
      </p>
      <p className="text-text-muted">{preset.description}</p>
      <PresetLayoutImage preset={preset} />
      <p className="text-text-muted">{preset.limitations}</p>
      <PresetGeometryList preset={preset} />
      <p>
        Layout only. Your current controller is retained; check it in Wiring. Configure wiring, pins
        and diodes before exporting. No extra layers are created.
      </p>
    </div>
  );
}

function PresetGeometryList({ preset }: { readonly preset: PresetLayout }) {
  const keys = preset.keys.map((key, keyIndex) => ({ ...key, id: `k${keyIndex}` }));
  return (
    <details>
      <summary>Key geometry and QWERTY assignments</summary>
      <ol
        aria-label="Preset key geometry"
        className="max-h-40 list-inside list-decimal overflow-auto"
      >
        {keys.map((key, keyIndex) => (
          <li key={key.id}>
            Key {keyIndex}: {key.keycode}, {key.widthU ?? 1}×{key.heightU ?? 1}u at {key.xU},{' '}
            {key.yU}u; rotation {key.rotationDeg ?? 0}°, origin {key.rotationOriginXU ?? 0},{' '}
            {key.rotationOriginYU ?? 0}u{key.half === undefined ? '' : `; ${key.half} half`}
          </li>
        ))}
      </ol>
    </details>
  );
}

function PresetLayoutImage({ preset }: { readonly preset: PresetLayout }) {
  const keys = preset.keys.map((key, keyIndex) => ({ ...key, id: `k${keyIndex}` }));
  const corners = keys.flatMap((key) => getKeyCorners(key));
  let minXU = Infinity;
  let minYU = Infinity;
  let maxXU = -Infinity;
  let maxYU = -Infinity;
  for (const point of corners) {
    minXU = Math.min(minXU, point.xU);
    minYU = Math.min(minYU, point.yU);
    maxXU = Math.max(maxXU, point.xU);
    maxYU = Math.max(maxYU, point.yU);
  }
  return (
    <svg
      aria-label={`${preset.name} layout preview`}
      className="h-40 w-full rounded-md bg-surface-muted"

      viewBox={`${minXU - 0.25} ${minYU - 0.25} ${maxXU - minXU + 0.5} ${maxYU - minYU + 0.5}`}
    >
      <title>{preset.name} layout preview</title>
      {keys.map((key) => (
        <rect
          className="fill-surface-raised stroke-text-muted"
          height={(key.heightU ?? 1) - 0.08}
          key={key.id}
          rx={0.06}
          strokeWidth={0.025}
          transform={`rotate(${key.rotationDeg ?? 0} ${key.rotationOriginXU ?? 0} ${key.rotationOriginYU ?? 0})`}
          width={(key.widthU ?? 1) - 0.08}
          x={key.xU + 0.04}
          y={key.yU + 0.04}
        />
      ))}
    </svg>
  );
}
