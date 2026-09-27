import { expect, it } from 'vitest';
import { createProject } from './create-project';
import type { Project } from './types';
import { validateProject } from './validate-project';

function codesAndPaths(project: Project) {
  return validateProject(project).map(({ code, path }) => ({ code, path }));
}

function named(name: string, shieldName?: string): Project {
  return shieldName === undefined
    ? { schemaVersion: 1, name }
    : { schemaVersion: 1, name, shieldName };
}

it('accepts a new project', () => {
  expect(validateProject(createProject())).toEqual([]);
});

it('reports a name without usable characters when there is no override', () => {
  expect(codesAndPaths(named('!!!'))).toEqual([{ code: 'shield-name-empty', path: ['name'] }]);
});

it('accepts such a name when a valid override is set', () => {
  expect(validateProject(named('!!!', 'corne'))).toEqual([]);
});

it.each(['2Bad', 'Corne', ''])('reports the invalid override %j', (shieldName) => {
  expect(codesAndPaths(named('Corne', shieldName))).toEqual([
    { code: 'shield-name-invalid', path: ['shieldName'] },
  ]);
});

it.each(['A very long keyboard name', 'Корнекорнекорн'])('reports %j as too long', (name) => {
  expect(codesAndPaths(named(name, 'corne'))).toEqual([
    { code: 'keyboard-name-too-long', path: ['name'] },
  ]);
});

it('accepts exactly 16 bytes', () => {
  expect(validateProject(named('1234567890123456'))).toEqual([]);
});

it('names the byte count in the too-long message', () => {
  expect(validateProject(named('Корнекорнекорн', 'corne'))[0]?.message).toContain('28 bytes');
});

it('keeps the table order', () => {
  expect(codesAndPaths(named('!!!!!!!!!!!!!!!!!'))).toEqual([
    { code: 'shield-name-empty', path: ['name'] },
    { code: 'keyboard-name-too-long', path: ['name'] },
  ]);
});
