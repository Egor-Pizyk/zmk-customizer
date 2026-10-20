// @vitest-environment jsdom
import { screen, within, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import { renderApp } from '../../../helpers/render-app';
import { getDefinedValue } from '../../../helpers/defined-value';
import { UNIBODY_PRESET } from '../../../helpers/unibody-preset';
import { loadProject } from '@storage/project';

it('commits four typed controls, cancels drafts, searches and preserves undo/history', async () => {
  const { user } = renderApp(undefined, { activeWorkspaceId: 'firmware' });
  const before = loadProject().project;
  await user.click(screen.getByRole('switch', { name: 'Words per minute' }));
  const idle = screen.getByRole('spinbutton', { name: 'Idle timeout (ms)' });
  await user.clear(idle);
  await user.type(idle, '45000{Enter}');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Keyboard rollover' }), 'NKRO');
  const manufacturer = screen.getByRole('textbox', { name: 'USB manufacturer' });
  await user.clear(manufacturer);
  await user.type(manufacturer, 'Maker{Enter}');
  expect(loadProject().project.firmware).toEqual({
    CONFIG_ZMK_WPM: true,
    CONFIG_ZMK_IDLE_TIMEOUT: 45_000,
    CONFIG_ZMK_HID_REPORT_TYPE: 'NKRO',
    CONFIG_USB_DEVICE_MANUFACTURER: 'Maker',
  });
  await user.clear(idle);
  await user.type(idle, '999{Escape}');
  await user.tab();
  expect(loadProject().project.firmware['CONFIG_ZMK_IDLE_TIMEOUT']).toBe(45_000);
  await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /^Undo/u }));
  expect(loadProject().project.firmware['CONFIG_USB_DEVICE_MANUFACTURER']).toBeUndefined();
  const search = screen.getByRole('searchbox', { name: 'Search firmware settings' });
  await user.type(search, 'no-match');
  expect(screen.getByText('No firmware settings match your search.').textContent).toContain(
    'No firmware settings match',
  );
  await user.clear(search);
  await user.type(search, 'CONFIG_ZMK_KSCAN_DEBOUNCE_PRESS');
  expect(screen.getByRole('spinbutton', { name: 'Press debounce (ms)' })).toBeTruthy();
  expect(screen.queryByRole('spinbutton', { name: 'Idle timeout (ms)' })).toBeNull();
  expect(loadProject().project.keys).toEqual(before.keys);
});

it('shows Firmware badge/inline issue, reveals a filtered target and repairs export', async () => {
  const { user } = renderApp(undefined, { activeWorkspaceId: 'firmware' });
  const press = screen.getByRole('spinbutton', { name: 'Press debounce (ms)' });
  await user.clear(press);
  await user.type(press, '-2{Enter}');
  expect(screen.getByRole('button', { name: 'Firmware, 1 problem' })).toBeTruthy();
  expect(press.getAttribute('aria-invalid')).toBe('true');
  await user.type(screen.getByRole('searchbox', { name: 'Search firmware settings' }), 'battery');
  await user.click(screen.getByRole('button', { name: 'Problems (1)' }));
  await user.click(screen.getByRole('button', { name: /Firmware: Press debounce:/u }));
  await waitFor(() => {
    expect(document.activeElement).toBe(press);
  });
  expect(screen.getByRole('searchbox').getAttribute('value')).toBe('');
  await user.click(screen.getByRole('button', { name: 'Reset Press debounce' }));
  expect(loadProject().project.firmware).toEqual({});
  expect(screen.queryByRole('button', { name: 'Firmware, 1 problem' })).toBeNull();
});

it('refuses oversized firmware text while retaining the last saved value, and permits repairable lengths', async () => {
  const { user } = renderApp(undefined, { activeWorkspaceId: 'firmware' });
  const manufacturer = screen.getByRole('textbox', { name: 'USB manufacturer' });
  await user.click(manufacturer);
  await user.clear(manufacturer);
  await user.paste('a'.repeat(1024));
  await user.keyboard('{Enter}');
  expect(loadProject().project.firmware['CONFIG_USB_DEVICE_MANUFACTURER']).toHaveLength(1024);
  const saved = loadProject().project;
  await user.clear(manufacturer);
  await user.paste('b'.repeat(1025));
  await user.keyboard('{Enter}');
  expect(loadProject().project).toEqual(saved);
  expect(screen.getByRole('textbox', { name: 'USB manufacturer' }).getAttribute('value')).toBe(
    'a'.repeat(1024),
  );
  expect(screen.getAllByText(/1024 characters/u).length).toBeGreaterThan(0);
});

it('refuses a 129th override and lets an unknown setting be reset before retry', async () => {
  const firmware = Object.fromEntries(
    Array.from({ length: 128 }, (_, index) => [`CONFIG_UNKNOWN_${index}`, true]),
  );
  const { user } = renderApp({ ...UNIBODY_PRESET, firmware }, { activeWorkspaceId: 'firmware' });
  const before = loadProject().project;
  await user.click(screen.getByRole('switch', { name: 'Words per minute' }));
  expect(loadProject().project).toEqual(before);
  expect(screen.getAllByText(/128 firmware overrides/u).length).toBeGreaterThan(0);
  await user.click(screen.getByRole('button', { name: 'Reset CONFIG_UNKNOWN_0' }));
  await user.click(screen.getByRole('switch', { name: 'Words per minute' }));
  expect(loadProject().project.firmware['CONFIG_ZMK_WPM']).toBe(true);
  expect(Object.keys(loadProject().project.firmware)).toHaveLength(128);
});

it('rejects malformed imported firmware without replacing current work', async () => {
  const { user, container } = renderApp(undefined, { activeWorkspaceId: 'firmware' });
  const before = loadProject().project;
  const file = new File([], 'malformed-firmware.json', { type: 'application/json' });
  Object.defineProperty(file, 'text', {
    value: () => Promise.resolve(JSON.stringify({ ...before, firmware: { CONFIG_ZMK_WPM: [] } })),
  });
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  await user.upload(getDefinedValue(input), file);
  await waitFor(() => {
    expect(screen.getByRole('alert').textContent).toContain('firmware');
  });
  expect(loadProject().project).toEqual(before);
});
