// @vitest-environment jsdom
import { screen, within, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { getDefinedValue } from '../../../helpers/defined-value';
import { renderApp } from '../../../helpers/render-app';
import { CONTROLLER_BOARDS } from '@catalog/controllers';
import { loadProject } from '@storage/project';
import { buildProject } from '../../../helpers/build-project';

it.each(CONTROLLER_BOARDS)(
  'explains $name and offers its exposed pins without reserved contacts',
  (board) => {
    renderApp({ ...loadPreset(), controllerId: board.id });
    const panel = screen.getByRole('region', { name: 'Controller' });
    expect(within(panel).getByText(board.description)).toBeTruthy();
    expect(
      within(panel)
        .getByRole('link', { name: `Docs for ${board.name} (opens in a new tab)` })
        .getAttribute('href'),
    ).toBe(board.docsUrl);
    const options = within(
      screen.getByRole('combobox', { name: 'Wire 0 end board pin' }),
    ).getAllByRole('option');
    for (const pin of board.pins) {
      expect(
        options.some((option) => option.textContent.includes(`${pin.label} · ${pin.mcu}`)),
      ).toBe(true);
    }
    expect(options.filter((option) => option.getAttribute('value') === '11')).toHaveLength(0);
  },
);

function loadPreset() {
  return buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0 }],
    wires: [
      {
        id: 'w0',
        start: { kind: 'key-pin', keyId: 'k0', pin: 1 },
        end: { kind: 'free', at: { xU: 2, yU: 0 }, boardPin: 2 },
        bends: [],
      },
    ],
  });
}

it('shows dropped pin details at its selector, lets the user explicitly clear or repair them and removes the error', async () => {
  const { user } = renderApp();
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Controller board' }),
    'seeeduino_xiao_ble',
  );
  const picker = screen.getByRole('combobox', { name: 'Wire 0 end board pin' });
  expect(picker.getAttribute('aria-invalid')).toBe('true');
  const descriptionId = picker.getAttribute('aria-describedby');
  expect(descriptionId).toBeTruthy();
  expect(document.querySelector(`[id="${getDefinedValue(descriptionId)}"]`)?.textContent).toContain(
    'nice!nano v2 D2',
  );
  await user.selectOptions(picker, '');
  expect(loadProject().project.wires[0]?.end).not.toHaveProperty('droppedBoardPin');
  expect(picker).toHaveProperty('value', '');
  await user.selectOptions(picker, '2');
  expect(picker.getAttribute('aria-invalid')).toBeNull();
  expect(loadProject().project.wires[0]?.end).toMatchObject({ boardPin: 2 });
});

it('creates keys and wires through the table, rejects a self-wire, and deletes a wire with undo', async () => {
  const { user } = renderApp(buildProject({}));
  await user.click(screen.getByRole('button', { name: 'Add key' }));
  await user.click(screen.getByRole('button', { name: 'Add key' }));
  expect(loadProject().project.keys).toHaveLength(2);
  const from = screen.getByRole('combobox', { name: 'From' });
  const to = screen.getByRole('combobox', { name: 'To' });
  await user.selectOptions(from, 'pin:k1:1');
  await user.selectOptions(to, 'pin:k1:1');
  await user.click(screen.getByRole('button', { name: /^Add wire/u }));
  expect(loadProject().project.wires).toHaveLength(0);
  await user.selectOptions(to, 'pin:k2:1');
  await user.click(screen.getByRole('button', { name: /^Add wire/u }));
  expect(loadProject().project.wires).toHaveLength(1);
  const wired = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Delete wire 0' }));
  expect(loadProject().project.wires).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(wired);
});

it('an export problem opens the owning workspace and focuses the pin needing repair', async () => {
  const { user } = renderApp();
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Controller board' }),
    'seeeduino_xiao_ble',
  );
  await user.click(screen.getByRole('button', { name: 'Export' }));
  await user.click(
    screen.getByRole('button', { name: /Schematic:.*was assigned to nice!nano v2 D2/u }),
  );
  await waitFor(() => {
    expect(document.activeElement).toBe(
      screen.getByRole('combobox', { name: 'Wire 0 end board pin' }),
    );
  });
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Schematic');
});

it('edits wire bends numerically and removes the added bend without altering keys or bindings', async () => {
  const { user } = renderApp();
  const before = loadProject().project;
  await user.click(screen.getByRole('button', { name: 'Add a bend to wire 0' }));
  expect(loadProject().project.wires[0]?.bends).toHaveLength(
    getDefinedValue(before.wires[0]).bends.length + 1,
  );
  const x = screen.getByRole('spinbutton', { name: 'Wire 0 bend 0 X (u)' });
  await user.clear(x);
  await user.type(x, '20{Enter}');
  expect(loadProject().project.wires[0]?.bends[0]?.xU).toBe(20);
  expect(loadProject().project.keys).toEqual(before.keys);
  expect(loadProject().project.layers).toEqual(before.layers);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
});

it('changes electrical crossing insulation through the table and undo restores the wiring', async () => {
  const { user } = renderApp();
  const before = loadProject().project;
  const crossing = getDefinedValue(screen.getAllByRole('switch', { name: /^Insulated/u })[0]);
  await user.click(crossing);
  expect(loadProject().project.insulatedCrossings).not.toEqual(before.insulatedCrossings);
  expect(loadProject().project.keys).toEqual(before.keys);
  await user.click(screen.getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project).toEqual(before);
});
