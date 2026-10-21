// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderApp } from '../../../helpers/render-app';
import { parseProjectFile, loadProject } from '@storage/project';
import { getKeyPinWires } from '@domain/wires';
import { getResultValue } from '../../../helpers/result';
import legacy from '../../../fixtures/project/v11-wiring-contacts.json?raw';

it('keeps a migrated intermediate pin connected through a numeric endpoint move and undo', async () => {
  const source = getResultValue(parseProjectFile(legacy));
  const { user } = renderApp(source);
  const y = screen.getByRole('spinbutton', { name: 'Key 0 Y (u)' });
  await user.clear(y);
  await user.type(y, '3{Enter}');
  await waitFor(() => {
    expect(loadProject().project.keys[0]?.yU).toBe(3);
  });
  expect(getKeyPinWires(loadProject().project)({ keyId: 'k2', pin: 1 })).toEqual([0]);
  expect(loadProject().project.layers).toEqual(source.layers);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  await waitFor(() => {
    expect(loadProject().project).toEqual(source);
  });
});
