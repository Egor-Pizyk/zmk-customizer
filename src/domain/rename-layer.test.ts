import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { renameLayer } from './rename-layer';

const PROJECT = buildProject({});

it('stores the name as typed', () => {
  const project = renameLayer(PROJECT, { layerIndex: 0, name: 'Nav & Sym' });
  expect(project.layers[0]).toEqual({ id: 'l0', name: 'Nav & Sym', bindings: {} });
});

it('returns the same project when the name does not change or the layer does not exist', () => {
  expect(renameLayer(PROJECT, { layerIndex: 0, name: 'Base' })).toBe(PROJECT);
  expect(renameLayer(PROJECT, { layerIndex: 3, name: 'Nav' })).toBe(PROJECT);
});
