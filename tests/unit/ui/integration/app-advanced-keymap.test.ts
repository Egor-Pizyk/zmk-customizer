// @vitest-environment jsdom
import { screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderApp } from '../../../helpers/render-app';
import { UNIBODY_PRESET } from '@catalog/presets';
import { loadProject } from '@storage/project';

it('edits a macro sequence, a combo and conditional layers and restores a deleted macro', async () => {
  const project = {
    ...UNIBODY_PRESET,
    layers: [...UNIBODY_PRESET.layers, { id: 'l2', name: 'Adjust', bindings: {} }],
  };
  const { user } = renderApp(project, {
    activeWorkspaceId: 'bindings',
    isAutoAdvanceEnabled: false,
  });
  await user.click(
    screen.getByText('Combos, macros and conditional layers', { selector: 'summary' }),
  );
  await user.type(screen.getByRole('textbox', { name: 'New macro name' }), 'Sequence');
  await user.click(screen.getByRole('button', { name: 'Create macro' }));
  await user.click(screen.getByText('Macro: Sequence', { selector: 'summary' }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Step 1 kind' }), 'press');
  await user.click(screen.getByRole('button', { name: 'Add pause' }));
  const pause = screen.getByRole('spinbutton', { name: 'Pause duration (ms)' });
  await user.clear(pause);
  await user.type(pause, '150{Enter}');
  await user.click(screen.getByRole('button', { name: 'Move step 2 up' }));
  expect(loadProject().project.macros[0]?.steps.map((step) => step.kind)).toEqual([
    'wait',
    'press',
  ]);
  await user.click(screen.getByText('Macro: Sequence', { selector: 'summary' }));
  await user.type(screen.getByRole('textbox', { name: 'New combo name' }), 'Escape');
  await user.click(screen.getByRole('button', { name: 'Create combo' }));
  await user.click(screen.getByText('Combo: Escape', { selector: 'summary' }));
  await user.click(screen.getByRole('checkbox', { name: 'Combo key 0' }));
  await user.click(screen.getByRole('checkbox', { name: 'Combo key 1' }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Combo action behavior' }), 'm1');
  expect(loadProject().project.combos[0]).toMatchObject({
    keyIds: ['k0', 'k1'],
    binding: { kind: 'macro', macroId: 'm1' },
  });
  await user.click(screen.getByRole('button', { name: 'Create conditional rule' }));
  await user.click(screen.getByText('Conditional rule q1', { selector: 'summary' }));
  expect(screen.getByRole('combobox', { name: 'Target layer' }).getAttribute('aria-invalid')).toBe(
    null,
  );
  expect(loadProject().project.conditionalLayers[0]).toEqual({
    id: 'q1',
    ifLayerIds: ['l0', 'l1'],
    thenLayerId: 'l2',
  });
  await user.click(screen.getByText('Macro: Sequence', { selector: 'summary' }));
  await user.click(screen.getByRole('button', { name: 'Delete macro Sequence' }));
  expect(screen.getByRole('textbox', { name: 'Combo name' }).getAttribute('aria-invalid')).toBe(
    'true',
  );
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project.macros[0]?.name).toBe('Sequence');
});

it('edits names, timing, filters and layout selection and deletes definitions', async () => {
  const { user } = renderApp(
    {
      ...UNIBODY_PRESET,
      layers: [...UNIBODY_PRESET.layers, { id: 'l2', name: 'Adjust', bindings: {} }],
    },
    { activeWorkspaceId: 'bindings', isAutoAdvanceEnabled: false },
  );
  await user.click(
    screen.getByText('Combos, macros and conditional layers', { selector: 'summary' }),
  );
  await user.type(screen.getByRole('textbox', { name: 'New combo name' }), 'Escape');
  await user.click(screen.getByRole('button', { name: 'Create combo' }));
  await user.click(screen.getByText('Combo: Escape', { selector: 'summary' }));
  const name = screen.getByRole('textbox', { name: 'Combo name' });
  await user.clear(name);
  await user.type(name, 'Chord{Enter}');
  const timeout = screen.getByRole('spinbutton', { name: 'Combo timeout (ms)' });
  await user.clear(timeout);
  await user.type(timeout, '80{Enter}');
  await user.click(screen.getByRole('checkbox', { name: 'Combo key 0' }));
  await user.click(screen.getByRole('checkbox', { name: 'Combo key 1' }));
  await user.click(screen.getByRole('checkbox', { name: 'Combo key 1' }));
  await user.click(screen.getByRole('button', { name: 'Select combo keys on layout' }));
  await user.click(screen.getByRole('button', { name: 'Use selected layout keys' }));
  await user.click(screen.getByRole('checkbox', { name: 'Combo layers: Fn' }));
  await user.click(screen.getByRole('checkbox', { name: 'Combo layers: Fn' }));
  expect(loadProject().project.combos[0]).toMatchObject({
    name: 'Chord',
    timeoutMs: 80,
    keyIds: ['k0'],
    layerIds: [],
  });
  await user.click(screen.getByRole('button', { name: 'Delete combo Chord' }));
  expect(loadProject().project.combos).toEqual([]);
});

it('edits macro steps and conditional inputs and target using labeled controls', async () => {
  const { user } = renderApp(
    {
      ...UNIBODY_PRESET,
      layers: [...UNIBODY_PRESET.layers, { id: 'l2', name: 'Adjust', bindings: {} }],
    },
    { activeWorkspaceId: 'bindings', isAutoAdvanceEnabled: false },
  );
  await user.click(
    screen.getByText('Combos, macros and conditional layers', { selector: 'summary' }),
  );
  await user.type(screen.getByRole('textbox', { name: 'New macro name' }), 'Sequence');
  await user.click(screen.getByRole('button', { name: 'Create macro' }));
  await user.click(screen.getByText('Macro: Sequence', { selector: 'summary' }));
  const name = screen.getByRole('textbox', { name: 'Macro name' });
  await user.clear(name);
  await user.type(name, 'Greeting{Enter}');
  const wait = screen.getByRole('spinbutton', { name: 'Wait between actions (ms)' });
  await user.clear(wait);
  await user.type(wait, '20{Enter}');
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Step 1 action behavior' }),
    'none',
  );
  await user.click(screen.getByRole('button', { name: 'Add action step' }));
  await user.click(screen.getByRole('button', { name: 'Move step 1 down' }));
  await user.click(screen.getByRole('button', { name: 'Remove step 2' }));
  expect(loadProject().project.macros[0]).toMatchObject({
    name: 'Greeting',
    waitMs: 20,
    steps: [{ id: 's2', kind: 'tap' }],
  });
  await user.click(screen.getByRole('button', { name: 'Create conditional rule' }));
  await user.click(screen.getByText('Conditional rule q1', { selector: 'summary' }));
  await user.click(screen.getByRole('checkbox', { name: 'Input layers: Fn' }));
  await user.click(screen.getByRole('checkbox', { name: 'Input layers: Fn' }));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Target layer' }), 'l1');
  expect(screen.getByRole('combobox', { name: 'Target layer' }).getAttribute('aria-invalid')).toBe(
    'true',
  );
  await user.click(screen.getByRole('button', { name: 'Delete conditional rule' }));
  expect(loadProject().project.conditionalLayers).toEqual([]);
});
