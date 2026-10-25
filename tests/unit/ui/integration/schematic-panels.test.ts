// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderApp } from '../../../helpers/render-app';
import { buildProject } from '../../../helpers/build-project';
import { loadProject } from '@storage/project';

it('keeps editor sections accessible without global collapse or close and preserves history', async () => {
  const source = buildProject({ keys: [{ id: 'k1', xU: 0, yU: 0 }] });
  const { user } = renderApp(source);
  expect(screen.getByRole('region', { name: 'Schematic editors' })).toBeTruthy();
  expect(
    screen.queryByRole('button', { name: /^(?:Collapse|Close|Open|Expand) editors$/u }),
  ).toBeNull();
  await user.click(screen.getByText('Controller', { exact: true }));
  expect(screen.getByText('Controller', { exact: true }).closest('details')?.open).toBe(true);
  await user.click(screen.getByText('Parts', { exact: true }));
  expect(screen.getByRole('region', { name: 'Wire sections' })).toBeTruthy();
  expect(loadProject().project).toEqual(source);
  expect(screen.getByRole('button', { name: /^Undo/u }).getAttribute('aria-disabled')).toBe('true');
});
