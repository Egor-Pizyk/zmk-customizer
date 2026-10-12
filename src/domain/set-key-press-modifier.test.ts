import { expect, it } from 'vitest';
import { buildProject } from '../../tests/helpers/build-project';
import { setKeyPressModifier } from './set-key-press-modifier';

const KEYS = [
  { id: 'k1', xU: 0, yU: 0 },
  { id: 'k2', xU: 1, yU: 0 },
];

it('adds a modifier in fixed order to every key-press binding and skips other kinds', () => {
  const project = buildProject({
    keys: KEYS,
    bindings: {
      k1: { kind: 'kp', key: { keycode: 'A', modifiers: ['LA'] } },
      k2: { kind: 'none' },
    },
  });
  const next = setKeyPressModifier(project, {
    layerIndex: 0,
    keyIds: ['k1', 'k2'],
    modifier: 'LC',
    isEnabled: true,
  });
  expect(next.layers[0]?.bindings).toEqual({
    k1: { kind: 'kp', key: { keycode: 'A', modifiers: ['LC', 'LA'] } },
    k2: { kind: 'none' },
  });
});

it('removes a modifier, and returns the same project when nothing changes', () => {
  const project = buildProject({
    keys: KEYS,
    bindings: { k1: { kind: 'kp', key: { keycode: 'A', modifiers: ['LC'] } } },
  });
  const removed = setKeyPressModifier(project, {
    layerIndex: 0,
    keyIds: ['k1'],
    modifier: 'LC',
    isEnabled: false,
  });
  expect(removed.layers[0]?.bindings['k1']).toEqual({
    kind: 'kp',
    key: { keycode: 'A', modifiers: [] },
  });
  expect(
    setKeyPressModifier(project, {
      layerIndex: 0,
      keyIds: ['k1'],
      modifier: 'LC',
      isEnabled: true,
    }),
  ).toBe(project);
});

it('changes the tap of mod-tap too', () => {
  const project = buildProject({
    keys: KEYS,
    bindings: {
      k1: {
        kind: 'mt',
        hold: { keycode: 'LSHIFT', modifiers: [] },
        tap: { keycode: 'A', modifiers: [] },
      },
    },
  });
  const next = setKeyPressModifier(project, {
    layerIndex: 0,
    keyIds: ['k1'],
    modifier: 'LG',
    isEnabled: true,
  });
  expect(next.layers[0]?.bindings['k1']).toEqual({
    kind: 'mt',
    hold: { keycode: 'LSHIFT', modifiers: [] },
    tap: { keycode: 'A', modifiers: ['LG'] },
  });
});

it('changes the tap of layer-tap too', () => {
  const project = buildProject({
    keys: KEYS,
    bindings: { k1: { kind: 'lt', layerId: 'l1', tap: { keycode: 'A', modifiers: [] } } },
  });
  const next = setKeyPressModifier(project, {
    layerIndex: 0,
    keyIds: ['k1'],
    modifier: 'LS',
    isEnabled: true,
  });
  expect(next.layers[0]?.bindings['k1']).toEqual({
    kind: 'lt',
    layerId: 'l1',
    tap: { keycode: 'A', modifiers: ['LS'] },
  });
});
