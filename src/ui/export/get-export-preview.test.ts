import { expect, it } from 'vitest';
import { UNIBODY_PRESET } from '../../catalog/unibody-preset';
import { getProjectAnalysis } from '../project-state';
import { getExportPreview } from './get-export-preview';

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
