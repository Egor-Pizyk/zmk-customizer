// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { loadProject } from '@storage/project';
import { getKeyPinWires } from '@domain/wires';
import { renderApp } from '../../../helpers/render-app';
import { buildProject, freeEnd, keyPin } from '../../../helpers/build-project';

it('previews only existing links, cancels, applies once and then reports no work', async () => {
  const source = buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0 }],
    wires: [
      {
        id: 'w0',
        start: keyPin('k0', 1),
        end: freeEnd(4, 2, 2),
        bends: [
          { xU: 0.3, yU: 1 },
          { xU: 4, yU: 1 },
        ],
      },
    ],
  });
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Prettify' }));
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Apply wiring' }).getAttribute('aria-disabled'),
    ).not.toBe('true');
  });
  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: 'Cancel wiring' }));
  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: 'Prettify' }));
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Apply wiring' }).getAttribute('aria-disabled'),
    ).not.toBe('true');
  });
  await user.click(screen.getByRole('button', { name: 'Apply wiring' }));
  const accepted = loadProject().project;
  expect(accepted.wires[0]?.bends).toEqual([{ xU: 4, yU: 0.3667 }]);
  expect(getKeyPinWires(accepted)({ keyId: 'k0', pin: 2 })).toEqual([]);
  await user.click(screen.getByRole('button', { name: 'Prettify' }));
  await screen.findByText('No wiring changes needed.');
  expect(screen.getByRole('button', { name: 'Apply wiring' }).getAttribute('aria-disabled')).toBe(
    'true',
  );
  await user.click(screen.getByRole('button', { name: 'Cancel wiring' }));
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(source);
});

it('replaces an unapplied generation preview and does not prettify its newly proposed connections', async () => {
  const source = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  const { user } = renderApp(source);
  await user.click(screen.getByText('Wiring', { exact: true }));
  await user.click(screen.getByRole('button', { name: 'Generate wiring' }));
  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: 'Apply wiring' }).getAttribute('aria-disabled'),
    ).not.toBe('true');
  });
  await user.click(screen.getByRole('button', { name: 'Prettify' }));
  await screen.findByText('No wires to prettify. Generate or draw wiring first.');
  expect(screen.getByRole('button', { name: 'Apply wiring' }).getAttribute('aria-disabled')).toBe(
    'true',
  );
  expect(loadProject().project).toEqual(source);
  await user.click(screen.getByRole('button', { name: 'Cancel wiring' }));
  expect(screen.getByRole('button', { name: /^Undo/u }).getAttribute('aria-disabled')).toBe('true');
});
