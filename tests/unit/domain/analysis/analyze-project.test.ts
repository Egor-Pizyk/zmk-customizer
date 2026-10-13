import { expect, it } from 'vitest';
import { buildMatrixProject } from '../../../helpers/build-matrix-project';
import { getResultValue } from '../../../helpers/result';
import { createAnalysisInput } from '../../../helpers/analysis-input';
import { analyzeProject } from '@domain';

const input = createAnalysisInput();
it('returns the electrical matrix, nets and issues for the same project revision', () => {
  const project = buildMatrixProject([
    [2, 8],
    [6, 9],
  ]);
  const analysis = analyzeProject(project, input);
  expect(analysis.project).toBe(project);
  expect(analysis.issues).toEqual([]);
  expect(getResultValue(analysis.matrix)).toEqual({
    rowPins: [2, 6],
    colPins: [8, 9],
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
    ],
    diodeDirection: 'col2row',
  });
  expect(analysis.nets).toHaveLength(4);
});
it('does not reuse valid issues or matrix for a changed invalid revision', () => {
  const project = buildMatrixProject([[2, 8]]);
  const invalid = { ...project, keys: project.keys.map(({ id, xU, yU }) => ({ id, xU, yU })) };
  const analysis = analyzeProject(invalid, input);
  expect(analysis.matrix.ok).toBe(false);
  expect(analysis.issues.map((issue) => issue.code)).toContain('key-diode-missing');
  expect(analyzeProject(project, input).issues).toEqual([]);
});
