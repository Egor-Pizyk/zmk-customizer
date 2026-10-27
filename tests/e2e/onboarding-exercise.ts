import { expect } from '@playwright/test';
import type { Page, Locator, TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { unzipSync, strFromU8 } from 'fflate';
import { editNumber } from './helpers';

export async function runOnboardingExercise(page: Page, info: TestInfo, isKeyboard: boolean) {
  await page.goto('/');
  await continueOnboardingExercise(page, info, isKeyboard);
}

export async function continueOnboardingExercise(page: Page, info: TestInfo, isKeyboard: boolean) {
  await activate(
    page.getByRole('button', { name: 'Start empty learning project', exact: true }),
    isKeyboard,
  );
  const name = page.getByRole('textbox', { name: 'Name', exact: true });
  await name.fill('My macropad');
  await name.press('Enter');
  for (let index = 0; index < 9; index += 1) {
    await activate(page.getByRole('button', { name: 'Add key', exact: true }), isKeyboard);
    if (index < 8) {
      await editNumber(page, `Key ${index} Y (u)`, String(Math.floor(index / 3)));
      await editNumber(page, `Key ${index} X (u)`, String(index % 3));
    }
  }
  await expect(
    page.getByRole('heading', { name: 'Choose a controller', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('heading', { name: 'Choose a controller', exact: true })
    .press('ControlOrMeta+z');
  await expect(page.getByRole('heading', { name: 'Place nine keys', exact: true })).toBeVisible();
  await activate(page.getByRole('button', { name: 'Add key', exact: true }), isKeyboard);
  await expect(
    page.getByRole('heading', { name: 'Choose a controller', exact: true }),
  ).toBeVisible();
  await activate(page.getByRole('button', { name: 'Confirm and continue' }), isKeyboard);
  for (let index = 0; index < 9; index += 1) {
    await activate(
      page
        .getByRole('region', { name: 'Schematic editors', exact: true })
        .getByRole('button', { name: `Add diode at key ${index} pin 1`, exact: true }),
      isKeyboard,
    );
  }
  await expect(
    page.getByRole('heading', { name: 'Connect the matrix', exact: true }),
  ).toBeVisible();
  await activate(page.getByRole('button', { name: 'Rebuild wiring', exact: true }), isKeyboard);
  await expect(
    page.getByRole('heading', { name: 'Connect the matrix', exact: true }),
  ).toBeVisible();
  await activate(page.getByRole('button', { name: 'Apply wiring', exact: true }), isKeyboard);
  await expect(
    page.getByRole('heading', { name: 'Check the six GPIOs', exact: true }),
  ).toBeVisible();
  await activate(page.getByRole('button', { name: 'Confirm and continue' }), isKeyboard);
  await expect(page.getByRole('heading', { name: 'Assign digits 1–9', exact: true })).toBeVisible();
  for (let index = 0; index < 9; index += 1) {
    await activate(
      page.getByRole('button', { name: `Choose action for key ${index}`, exact: true }),
      isKeyboard,
    );
    if ((await page.getByRole('button', { name: /^key:/u }).count()) === 0) {
      await activate(page.getByRole('button', { name: 'Key press', exact: true }), isKeyboard);
    }
    await activate(page.getByRole('button', { name: /^key:/u }), isKeyboard);
    const search = page.getByRole('searchbox', {
      name: 'Search by name, code or symbol',
      exact: true,
    });
    await search.fill(`N${index + 1}`);
    await search.press('Enter');
  }
  await expect(page.getByRole('heading', { name: 'Check Problems', exact: true })).toBeVisible();
  await activate(page.getByRole('button', { name: 'Confirm and continue' }), isKeyboard);
  await expect(
    page.getByRole('heading', { name: 'Review firmware options', exact: true }),
  ).toBeVisible();
  await activate(page.getByRole('button', { name: 'Confirm and continue' }), isKeyboard);
  await expect(
    page.getByRole('heading', { name: 'Inspect generated files', exact: true }),
  ).toBeFocused();
  for (const [index, path] of [
    'config/my_macropad.keymap',
    'config/my_macropad.conf',
    'boards/shields/my_macropad/my_macropad.overlay',
  ].entries()) {
    await activate(page.getByRole('button', { name: `Inspect ${path}`, exact: true }), isKeyboard);
    await expect(page.getByText(`File groups inspected: ${index + 1} of 3.`)).toBeVisible();
  }
  await activate(page.getByRole('button', { name: 'Confirm and continue' }), isKeyboard);
  for (const heading of [
    'Other ways to start',
    'Import a KLE layout',
    'Layers and advanced actions',
    'Hardware and app settings',
    'App settings',
  ]) {
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await activate(page.getByRole('button', { name: 'Confirm and continue' }), isKeyboard);
  }
  await expect(
    page.getByRole('heading', { name: 'Download your ZMK configuration', exact: true }),
  ).toBeVisible();
  const preview = await page.locator('pre[aria-label]').evaluateAll((elements) =>
    elements.map((element) => ({
      path: element.getAttribute('aria-label') ?? '',
      text: element.textContent,
    })),
  );
  const pending = page.waitForEvent('download');
  await activate(page.getByRole('button', { name: 'Download .zip', exact: true }), isKeyboard);
  const download = await pending;
  const path = await download.path();
  expect(path).not.toBeNull();
  const files = unzipSync(await readFile(path));
  for (const item of preview) {
    expect(strFromU8(files[item.path] ?? new Uint8Array())).toBe(item.text);
  }
  expect(strFromU8(files['config/my_macropad.keymap'] ?? new Uint8Array())).toMatch(
    /&kp NUMBER_1[\s\S]*&kp NUMBER_9/u,
  );
  const overlay = strFromU8(
    files['boards/shields/my_macropad/my_macropad.overlay'] ?? new Uint8Array(),
  );
  expect(overlay).toContain('rows = <3>');
  expect(overlay).toContain('columns = <3>');
  for (const cell of [
    'RC(0,0)',
    'RC(0,1)',
    'RC(0,2)',
    'RC(1,0)',
    'RC(1,1)',
    'RC(1,2)',
    'RC(2,0)',
    'RC(2,1)',
    'RC(2,2)',
  ]) {
    expect(overlay).toContain(cell);
  }
  await expect(
    page.getByRole('heading', { name: 'Your macropad configuration is ready', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath('onboarding-completed.png') });
  await activate(
    page.getByRole('button', { name: 'Keep learning project', exact: true }),
    isKeyboard,
  );
  await activate(page.getByRole('button', { name: 'Cancel', exact: true }), isKeyboard);
  await expect(
    page.getByRole('heading', { name: 'Your macropad configuration is ready', exact: true }),
  ).toBeVisible();
  if (isKeyboard) {
    await activate(
      page.getByRole('button', { name: 'Keep learning project', exact: true }),
      isKeyboard,
    );
    await activate(
      page.getByRole('button', { name: 'Replace current project with macropad', exact: true }),
      isKeyboard,
    );
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue(
      'My macropad',
    );
    return;
  }
  await activate(
    page.getByRole('button', { name: 'Return to original project', exact: true }),
    isKeyboard,
  );
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('My keyboard');
  await activate(page.getByRole('button', { name: 'Take the tour again' }), isKeyboard);
  await activate(page.getByRole('button', { name: 'Start empty learning project' }), isKeyboard);
  await expect(page.getByText(/replaces only the retained learning draft/u)).toBeVisible();
  await activate(page.getByRole('button', { name: 'Start empty learning project' }), isKeyboard);
  await expect(page.getByRole('heading', { name: 'Name your macropad' })).toBeVisible();
  await activate(page.getByRole('button', { name: 'Exit tour', exact: true }), isKeyboard);
  await activate(
    page.getByRole('button', { name: 'Discard learning session and exit' }),
    isKeyboard,
  );
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('My keyboard');
}

async function activate(locator: Locator, isKeyboard: boolean) {
  if (isKeyboard) {
    await locator.press('Enter');
    return;
  }
  await locator.click();
}
