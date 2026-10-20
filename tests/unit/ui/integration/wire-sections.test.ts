// @vitest-environment jsdom
import { getDefinedValue } from '../../../helpers/defined-value';
import { expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderApp } from '../../../helpers/render-app';
import { buildProject, keyPin } from '../../../helpers/build-project';
import { loadProject } from '@storage/project';
import { addWire } from '@domain/wires/editing';

it('selects separate sections with the keyboard, deletes once and restores the exact project', async () => {
  const source = addWire(
    buildProject({
      keys: [
        { id: 'k1', xU: 0, yU: 0 },
        { id: 'k2', xU: 2, yU: 0 },
        { id: 'k3', xU: 4, yU: 0 },
      ],
    }),
    { start: keyPin('k1', 1), end: keyPin('k3', 1), bends: [] },
  );
  const { user } = renderApp(source);
  const sections = within(screen.getByRole('region', { name: 'Wire sections' })).getAllByRole(
    'checkbox',
  );
  await user.click(getDefinedValue(sections[0]));
  await user.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(sections[1]);
  await user.keyboard(' ');
  await user.keyboard('{Delete}');
  await waitFor(() => {
    expect(loadProject().project.wires).toHaveLength(0);
  });
  expect(loadProject().project.keys).toEqual(source.keys);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  await waitFor(() => {
    expect(loadProject().project).toEqual(source);
  });
});
