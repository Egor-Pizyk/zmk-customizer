import { expect, it, vi } from 'vitest';
import { buildProject } from '../../../tests/helpers/build-project';
import type { Binding, Project } from '../../domain/types';
import { useCopiedBinding } from './use-copied-binding';
import { useLayerActions } from './use-layer-actions';

const session = vi.hoisted(() => {
  const initial: { project: Project; copiedBinding: Binding | undefined } = {
    project: {
      schemaVersion: 3,
      name: 'Test',
      keys: [],
      wires: [],
      insulatedCrossings: [],
      layers: [],
    },
    copiedBinding: undefined,
  };
  return initial;
});

vi.mock('react', () => ({
  useState: () => [
    session.copiedBinding,
    (binding: Binding) => {
      session.copiedBinding = binding;
    },
  ],
}));
vi.mock('../preferences-context', () => ({
  usePreferences: () => ({ changePreferences: vi.fn<() => void>() }),
}));
vi.mock('../project-context', () => ({
  useProject: () => ({
    project: session.project,
    announce: vi.fn<() => void>(),
    commit: (change: (project: Project) => Project) => {
      session.project = change(session.project);
    },
  }),
}));

it('reserves the copied target when adding a layer, then pastes the original dangling reference', () => {
  session.copiedBinding = undefined;
  session.project = buildProject({
    keys: [{ id: 'k1', xU: 0, yU: 0 }],
    layers: [
      { id: 'l0', name: 'Base', bindings: { k1: { kind: 'mo', layerId: 'l1' } } },
      { id: 'l1', name: 'Nav', bindings: {} },
    ],
  });
  const options = { target: { layerIndex: 0, keyIds: ['k1'] }, selectionName: 'Key 0' };
  useCopiedBinding(options).handleCopy();
  session.project = { ...session.project, layers: [{ id: 'l0', name: 'Base', bindings: {} }] };
  const copied = useCopiedBinding(options);
  useLayerActions({
    project: session.project,
    issues: [],
    layerIndex: 0,
    reservedLayerIds: copied.reservedLayerIds,
    commit: (change) => {
      session.project = change(session.project);
    },
  }).handleLayerAdd();
  expect(session.project.layers[1]?.id).toBe('l2');
  useCopiedBinding(options).handlePaste();
  expect(session.project.layers[0]?.bindings['k1']).toEqual({ kind: 'mo', layerId: 'l1' });
});
