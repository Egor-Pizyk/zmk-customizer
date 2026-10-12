import { getControllerFixtures } from '../../tests/helpers/controller-fixtures';
import { expect, it } from 'vitest';
import { buildMatrixProject } from '../../tests/helpers/build-matrix-project';
import { validateShieldProject } from './validate-shield-project';

const { getBoard: getControllerBoard } = getControllerFixtures();

const options = {
  board: getControllerBoard('nice_nano_v2'),
  target: { boardId: 'nice_nano_v2', gpioPins: [2, 6, 8, 9, 10, 11, 17, 20, 22, 24, 29, 31] },
  bindingsCatalog: { keycodeNames: new Set(['A']), bluetoothProfileCount: 5, maxLayerCount: 32 },
};
it('accepts a complete project without mutating schemaVersion 5', () => {
  const project = buildMatrixProject();
  const before = JSON.stringify(project);
  expect(validateShieldProject(project, options)).toEqual([]);
  expect(JSON.stringify(project)).toBe(before);
});
it('rejects name controls and malformed unicode but permits escapable quotes/backslashes/dollars', () => {
  const project = buildMatrixProject();
  for (const name of ['A\nB', 'A\u0000B', 'A\uD800']) {
    expect(validateShieldProject({ ...project, name }, options)).toContainEqual(
      expect.objectContaining({ code: 'keyboard-name-unsafe', path: ['name'] }),
    );
  }
  expect(validateShieldProject({ ...project, name: 'A"\\$(X)' }, options)).toEqual([]);
});
it('enforces signed physical cells including rounded boundaries', () => {
  const project = buildMatrixProject([[2, 8]]);
  function at(xU: number) {
    return {
      ...project,
      keys: Array.from(project.keys, (key) => ({ ...key, xU })),
    };
  }
  expect(
    validateShieldProject(at(-327.68), options).some(
      (issue) => issue.code === 'physical-layout-out-of-range',
    ),
  ).toBe(false);
  expect(validateShieldProject(at(327.675), options)).toContainEqual(
    expect.objectContaining({ code: 'physical-layout-out-of-range', path: ['keys', 0] }),
  );
});
it('retains layer validation and enforces UTF-8 and sanitized name length', () => {
  const project = buildMatrixProject();
  const layers = [
    { id: 'l0', name: 'a'.repeat(26), bindings: {} },
    { id: 'l1', name: 'Fn😀😀😀😀😀', bindings: {} },
  ];
  const issues = validateShieldProject({ ...project, layers }, options);
  expect(issues).toContainEqual(
    expect.objectContaining({ code: 'layer-node-name-too-long', path: ['layers', 0, 'name'] }),
  );
  expect(issues).toContainEqual(
    expect.objectContaining({ code: 'layer-display-name-too-long', path: ['layers', 1, 'name'] }),
  );
  expect(
    validateShieldProject(
      { ...project, layers: [{ id: 'l0', name: 'Fn"', bindings: {} }] },
      options,
    ),
  ).toContainEqual(expect.objectContaining({ code: 'layer-name-invalid-character' }));
});
it('keeps existing electrical and binding blockers', () => {
  const project = buildMatrixProject([
    [2, 8],
    [2, 8],
  ]);
  const issues = validateShieldProject(
    {
      ...project,
      layers: [{ id: 'l0', name: 'Base', bindings: { k0: { kind: 'mo', layerId: 'missing' } } }],
    },
    options,
  );
  expect(issues.some((issue) => issue.code === 'keys-in-parallel')).toBe(true);
  expect(issues.some((issue) => issue.code === 'binding-layer-missing')).toBe(true);
});
