import { setKeyGeometries } from '@domain/keys';
import { UNIBODY_PRESET } from '@catalog/presets';
import { getProjectAnalysis } from '@ui/project/logic';
import { getExportPreview } from '@ui/export/logic';
import { expect, it } from 'vitest';

it('returns no generated files for a valid matrix with incompatible Bluetooth bindings', () => {
  const analysis = getProjectAnalysis({ ...UNIBODY_PRESET, controllerId: 'adafruit_kb2040' });
  expect(analysis.matrix.ok).toBe(true);
  expect(analysis.issues.map((issue) => issue.code)).toContain('binding-controller-unsupported');
  expect(getExportPreview(analysis, { includeWorkflow: true }).files).toEqual([]);
});

it('returns generated files only from the matching valid project revision', () => {
  const analysis = getProjectAnalysis(UNIBODY_PRESET);
  const preview = getExportPreview(analysis, { includeWorkflow: true });
  expect(preview.problems).toEqual([]);
  expect(preview.files.some((file) => file.path === 'build.yaml')).toBe(true);
  const invalid = getProjectAnalysis({
    ...UNIBODY_PRESET,
    keys: [],
    wires: [],
    insulatedCrossings: [],
  });
  expect(getExportPreview(invalid, { includeWorkflow: true }).files).toEqual([]);
});

it('blocks repairable invalid geometry even when the electrical matrix is valid', () => {
  const analysis = getProjectAnalysis(
    setKeyGeometries(UNIBODY_PRESET, { changes: [{ keyId: 'k0', geometry: { widthU: 0 } }] }),
  );
  expect(analysis.matrix.ok).toBe(true);
  expect(analysis.issues.map((issue) => issue.code)).toContain('physical-layout-out-of-range');
  expect(getExportPreview(analysis, { includeWorkflow: true }).files).toEqual([]);
});
