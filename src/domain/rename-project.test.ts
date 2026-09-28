import { expect, it } from 'vitest';
import type { Project } from './types';
import { renameProject } from './rename-project';

const PROJECT: Project = {
  schemaVersion: 2,
  keys: [],
  wires: [],
  insulatedCrossings: [],
  name: 'Old',
  shieldName: 'corne',
};

it('sets the name exactly as typed and keeps the override', () => {
  expect(renameProject(PROJECT, { name: '  New  ' })).toEqual({
    schemaVersion: 2,
    keys: [],
    wires: [],
    insulatedCrossings: [],
    name: '  New  ',
    shieldName: 'corne',
  });
});

it('does not mutate the input', () => {
  renameProject(PROJECT, { name: 'New' });
  expect(PROJECT.name).toBe('Old');
});

it('returns the same reference when the name is unchanged', () => {
  expect(renameProject(PROJECT, { name: 'Old' })).toBe(PROJECT);
});
