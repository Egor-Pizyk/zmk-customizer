import { expect, it } from 'vitest';
import { createProject } from './create-project';
import { getKeyDiodeState } from './get-key-diode-state';
import { toggleKeyDiode } from './toggle-key-diode';

const project = { ...createProject(), keys: [{ id: 'k1', xU: 0, yU: 0 }] };
it('adds one diode, blocks the other pin, and removes from the active pin', () => {
  const added = toggleKeyDiode(project, { keyId: 'k1', pin: 1 });
  expect(added.keys[0]?.diode).toEqual({ pin: 1, cathode: 'away-switch' });
  expect(getKeyDiodeState(added.keys[0], 2)).toEqual({ isPresent: false, isDisabled: true });
  expect(toggleKeyDiode(added, { keyId: 'k1', pin: 2 })).toBe(added);
  expect(toggleKeyDiode(added, { keyId: 'k1', pin: 1 })).toEqual(project);
  expect(project.keys[0]).not.toHaveProperty('diode');
  expect(added.wires).toBe(project.wires);
  expect(added.layers).toBe(project.layers);
});
it('supports pin 2 and ignores missing keys', () => {
  expect(toggleKeyDiode(project, { keyId: 'k1', pin: 2 }).keys[0]?.diode?.pin).toBe(2);
  expect(toggleKeyDiode(project, { keyId: 'k9', pin: 1 })).toBe(project);
});
