import { expect, it } from 'vitest';
import { createProject } from './create-project';

it('creates an empty project named My keyboard without a technical name override', () => {
  const project = createProject();
  expect(project).toEqual({ schemaVersion: 1, name: 'My keyboard' });
  expect('shieldName' in project).toBe(false);
});
