import { expect, test } from './test';
import type { Page } from '@playwright/test';
import { UNIBODY_PRESET } from '../helpers/unibody-preset';
import { parseProjectFile } from '@storage/project';
import { getResultValue } from '../helpers/result';
import {
  downloadJson,
  downloadZip,
  editNumber,
  history,
  openProject,
  saved,
  workspace,
} from './helpers';

async function useLegacyDirectPins(page: Page, index: number) {
  await page.getByRole('checkbox', { name: `Encoder ${index} push switch`, exact: true }).uncheck();
  await page
    .getByRole('checkbox', { name: `Encoder ${index} schematic wiring`, exact: true })
    .uncheck();
}

test('encoder hardware and layer actions persist, export and undo by keyboard @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await openProject(page, UNIBODY_PRESET);
  await page.getByText('Encoders', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Add encoder', exact: true }).press('Enter');
  await useLegacyDirectPins(page, 0);
  await page.getByLabel('Encoder 0 A pin', { exact: true }).selectOption('20');
  await page.getByLabel('Encoder 0 B pin', { exact: true }).selectOption('21');
  await editNumber(page, 'Encoder 0 X (u)', '7');
  await editNumber(page, 'Encoder 0 Y (u)', '0');
  await editNumber(page, 'Encoder 0 Electrical steps per rotation', '40');
  await editNumber(page, 'Encoder 0 Triggers per rotation', '10');
  const x = page.getByRole('spinbutton', { name: 'Encoder 0 X (u)', exact: true });
  await x.fill('99');
  await x.press('Escape');
  await expect(x).toHaveValue('7');
  const marker = page.locator('[role="graphics-symbol"][aria-label^="Encoder 0,"]');
  await expect(marker).toHaveAttribute('aria-label', /at 7, 0/u);
  await expect(marker.locator('circle.cursor-move')).toHaveAttribute('cx', '7.5');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await test.info().attach('encoder-editor-1024', {
    body: await page.screenshot({ path: test.info().outputPath('encoder-editor-1024.png') }),
    contentType: 'image/png',
  });
  await workspace(page, 'Bindings');
  await page.getByText('Encoder actions', { exact: true }).press('Enter');
  await page.getByLabel('Encoder 0 clockwise behavior', { exact: true }).selectOption('kp');
  await page.getByLabel('Encoder 0 clockwise key', { exact: true }).selectOption('C_VOLUME_UP');
  await page.getByRole('tab', { name: /1 Fn/u }).press('Enter');
  await page.getByLabel('Encoder 0 counterclockwise behavior', { exact: true }).selectOption('kp');
  await page
    .getByLabel('Encoder 0 counterclockwise key', { exact: true })
    .selectOption('PAGE_DOWN');
  const before = await saved(page);
  expect(before.layers[0]?.encoderBindings?.['e1']?.clockwise).toEqual({
    kind: 'kp',
    key: { keycode: 'C_VOLUME_UP', modifiers: [] },
  });
  expect(before.layers[1]?.encoderBindings?.['e1']?.counterclockwise).toEqual({
    kind: 'kp',
    key: { keycode: 'PAGE_DOWN', modifiers: [] },
  });
  expect(getResultValue(parseProjectFile(await downloadJson(page)))).toEqual(before);
  await page.reload();
  expect(await saved(page)).toEqual(before);
  await workspace(page, 'Schematic');
  await page.getByText('Encoders', { exact: true }).press('Enter');
  await expect(
    page.getByRole('spinbutton', { name: 'Encoder 0 Electrical steps per rotation', exact: true }),
  ).toHaveValue('40');
  await page.getByRole('button', { name: 'Delete encoder 0', exact: true }).press('Enter');
  await expect(page.getByRole('button', { name: 'Add encoder', exact: true })).toBeFocused();
  await expect(marker).toHaveCount(0);
  await history(page, 'Undo').press('Enter');
  expect(await saved(page)).toEqual(before);
  const files = await downloadZip(page);
  expect(files['boards/shields/unibody_six/unibody_six.overlay']).toContain('steps = <40>;');
  expect(files['boards/shields/unibody_six/unibody_six.overlay']).toContain(
    'triggers-per-rotation = <10>;',
  );
  expect(files['config/unibody_six.keymap']).toContain('bindings = <&kp C_VOLUME_UP>, <&none>;');
  expect(files['config/unibody_six.keymap']).toContain('bindings = <&none>, <&kp PAGE_DOWN>;');
  expect(files['boards/shields/unibody_six/Kconfig.defconfig']).toContain(
    'default EC11_TRIGGER_GLOBAL_THREAD',
  );
});

test('encoder problems block export and navigate to the owning control and layer', async ({
  page,
}) => {
  await openProject(page, UNIBODY_PRESET);
  await page.getByText('Encoders', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Add encoder', exact: true }).press('Enter');
  await useLegacyDirectPins(page, 0);
  await workspace(page, 'Export');
  await expect(page.getByRole('button', { name: 'Download .zip', exact: true })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await page.getByRole('button', { name: /Schematic: Encoder 0: assign A/u }).press('Enter');
  const aPin = page.getByLabel('Encoder 0 A pin', { exact: true });
  await expect(aPin).toBeFocused();
  await aPin.selectOption('2');
  await page.getByLabel('Encoder 0 B pin', { exact: true }).selectOption('21');
  await workspace(page, 'Export');
  await page
    .getByRole('button', { name: /Schematic: Encoder 0: pin D2 is already used/u })
    .press('Enter');
  await expect(aPin).toBeFocused();
  await aPin.selectOption('20');
  await editNumber(page, 'Encoder 0 Triggers per rotation', '7');
  await workspace(page, 'Export');
  await page
    .getByRole('button', {
      name: /Schematic: Encoder 0: triggers per rotation must be a positive divisor/u,
    })
    .press('Enter');
  const triggers = page.getByRole('spinbutton', {
    name: 'Encoder 0 Triggers per rotation',
    exact: true,
  });
  await expect(triggers).toBeFocused();
  await triggers.fill('24');
  await triggers.press('Enter');
  await workspace(page, 'Bindings');
  await page.getByRole('tab', { name: /1 Fn/u }).press('Enter');
  await page.getByText('Encoder actions', { exact: true }).press('Enter');
  await page.getByLabel('Encoder 0 clockwise behavior', { exact: true }).selectOption('mo');
  await page.getByRole('button', { name: 'Delete layer', exact: true }).press('Enter');
  await history(page, 'Undo').press('Enter');
  // Real missing-target repair is covered with an imported project, preserving the inactive layer.
  const current = await saved(page);
  const broken = {
    ...current,
    layers: current.layers.map((layer, index) =>
      index === 1
        ? ({
            ...layer,
            encoderBindings: {
              e1: {
                clockwise: { kind: 'macro', macroId: 'm99' },
                counterclockwise: { kind: 'none' },
              },
            },
          } as const)
        : layer,
    ),
  };
  await openProject(page, broken);
  await workspace(page, 'Export');
  await page
    .getByRole('button', { name: /Bindings: Encoder 0 clockwise on layer Fn uses deleted macro/u })
    .press('Enter');
  await expect(
    page.locator('[data-issue-path="layers.1.encoderBindings.e1.clockwise"]'),
  ).toBeFocused();
  await page.getByLabel('Encoder 0 clockwise behavior', { exact: true }).selectOption('none');
  await workspace(page, 'Export');
  await expect(
    page.getByRole('button', { name: 'Download .zip', exact: true }),
  ).not.toHaveAttribute('aria-disabled', 'true');
});

test('split encoders retain independent half pins, layer actions and local export activation', async ({
  page,
}) => {
  await openProject(page, UNIBODY_PRESET);
  await page
    .locator('summary')
    .filter({ hasText: /^Wiring$/u })
    .press('Enter');
  await page
    .getByRole('combobox', { name: 'Keyboard topology', exact: true })
    .selectOption('split');
  for (const half of ['left', 'right']) {
    await page.getByRole('combobox', { name: `${half} row 0 pin`, exact: true }).selectOption('0');
    await page.getByRole('combobox', { name: `${half} row 1 pin`, exact: true }).selectOption('1');
    await page.getByRole('combobox', { name: `${half} col 0 pin`, exact: true }).selectOption('2');
  }
  await page.getByRole('combobox', { name: 'left col 1 pin', exact: true }).selectOption('3');
  await page.getByRole('button', { name: 'Apply wiring', exact: true }).press('Enter');
  await page
    .locator('summary')
    .filter({ hasText: /^Wiring$/u })
    .press('Enter');
  await page.getByText('Encoders', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Add encoder', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Add encoder', exact: true }).press('Enter');
  await useLegacyDirectPins(page, 0);
  await useLegacyDirectPins(page, 1);
  await page.getByLabel('Encoder 1 half', { exact: true }).selectOption('right');
  for (const index of [0, 1]) {
    await page.getByLabel(`Encoder ${index} A pin`, { exact: true }).selectOption('20');
    await page.getByLabel(`Encoder ${index} B pin`, { exact: true }).selectOption('21');
  }
  await editNumber(page, 'Encoder 1 X (u)', '8');
  await editNumber(page, 'Encoder 1 Triggers per rotation', '10');
  await workspace(page, 'Bindings');
  await page.getByText('Encoder actions', { exact: true }).press('Enter');
  await page.getByLabel('Encoder 0 clockwise behavior', { exact: true }).selectOption('kp');
  await page.getByLabel('Encoder 0 clockwise key', { exact: true }).selectOption('C_VOLUME_UP');
  await page.getByLabel('Encoder 1 counterclockwise behavior', { exact: true }).selectOption('kp');
  await page
    .getByLabel('Encoder 1 counterclockwise key', { exact: true })
    .selectOption('PAGE_DOWN');
  await page.getByRole('tab', { name: /1 Fn/u }).press('Enter');
  await page.getByLabel('Encoder 1 clockwise behavior', { exact: true }).selectOption('kp');
  await page.getByLabel('Encoder 1 clockwise key', { exact: true }).selectOption('PAGE_UP');
  const before = await saved(page);
  const files = await downloadZip(page);
  expect(files['boards/shields/unibody_six/unibody_six.dtsi']).toContain(
    'sensors = <&encoder_0 &encoder_1>;',
  );
  expect(files['boards/shields/unibody_six/unibody_six.dtsi']).toContain(
    'triggers-per-rotation = <10>;',
  );
  expect(files['boards/shields/unibody_six/unibody_six_left.overlay']).toContain(
    '&encoder_0 { status = "okay"; };',
  );
  expect(files['boards/shields/unibody_six/unibody_six_left.overlay']).not.toContain('&encoder_1');
  expect(files['boards/shields/unibody_six/unibody_six_right.overlay']).toContain(
    '&encoder_1 { status = "okay"; };',
  );
  expect(files['boards/shields/unibody_six/unibody_six_right.overlay']).not.toContain('&encoder_0');
  expect(files['config/unibody_six.keymap']).toContain('bindings = <&none>, <&kp PAGE_DOWN>;');
  expect(files['config/unibody_six.keymap']).toContain('bindings = <&kp PAGE_UP>, <&none>;');
  await page.reload();
  expect(await saved(page)).toEqual(before);
});
