import { expect, test } from '@playwright/test';
import { expectGeometry, history, key, openProject, saved } from './helpers';

test('keyboard-only table selection, native stepping, properties, duplication and deletion @cross-browser', async ({
  page,
  browserName,
}) => {
  await openProject(page);
  // Start at the document, then enter controls through Tab rather than pointer/focus injection.
  await page.keyboard.press('Control+Home');
  for (let index = 0; index < 60; index++) {
    if (
      await page
        .getByRole('checkbox', { name: 'Select key 0', exact: true })
        .evaluate((element) => element === document.activeElement)
    ) {
      break;
    }
    await page.keyboard.press('Tab');
  }
  const first = page.getByRole('checkbox', { name: 'Select key 0', exact: true });
  await expect(first).toBeFocused();
  await page.keyboard.press('Space');
  await expect(first).toBeChecked();
  await page.keyboard.press('Shift+ArrowDown');
  await expect(page.getByRole('checkbox', { name: 'Select key 1', exact: true })).toBeFocused();
  await expect(page.getByRole('checkbox', { name: 'Select key 1', exact: true })).toBeChecked();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Tab');
  const x = page.getByRole('spinbutton', { name: 'Key 0 X (u)', exact: true });
  await expect(x).toBeFocused();
  const before = await saved(page);
  await page.keyboard.press('ArrowUp');
  await expect(x).toHaveValue('5.25');
  expect(await saved(page)).toEqual(before);
  await page.keyboard.press('Enter');
  await expectGeometry(page, { id: 'k0', xU: 5.25, yU: 5 });
  expect((await saved(page)).keys[0]?.xU).toBe(5.25);
  for (const property of [
    { name: 'Key 0 Y (u)', value: '5' },
    { name: 'Key 0 Rotation (°)', value: '30' },
    { name: 'Key 0 Origin X (u)', value: '5.5' },
    { name: 'Key 0 Origin Y (u)', value: '5.5' },
  ]) {
    await page.keyboard.press('Tab');
    await expect(page.getByRole('spinbutton', { name: property.name, exact: true })).toBeFocused();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type(property.value);
    await page.keyboard.press('Enter');
    const changed = (await saved(page)).keys[0];
    if (changed === undefined) {
      throw new Error('Missing keyboard-edited key');
    }
    await expectGeometry(page, changed);
  }
  expect((await saved(page)).keys[0]).toMatchObject({
    xU: 5.25,
    yU: 5,
    rotationDeg: 30,
    rotationOriginXU: 5.5,
    rotationOriginYU: 5.5,
  });
  // Traverse the table and layout controls using native Tab; Enter invokes actions.
  for (let index = 0; index < 80; index++) {
    if (
      await page
        .getByRole('button', { name: 'Duplicate selected keys', exact: true })
        .evaluate((element) => element === document.activeElement)
    ) {
      break;
    }
    await page.keyboard.press(
      browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Shift+Tab' : 'Shift+Tab',
    );
  }
  await expect(
    page.getByRole('button', { name: 'Duplicate selected keys', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  expect((await saved(page)).keys).toHaveLength(4);
  await expect(key(page, 3)).toBeVisible();
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab',
  );
  await expect(
    page.getByRole('button', { name: 'Delete selected keys', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  expect((await saved(page)).keys).toHaveLength(2);
  await page.keyboard.press('ControlOrMeta+z');
  expect((await saved(page)).keys).toHaveLength(4);
  await expect(key(page, 3)).toBeVisible();
});

test('native dialogs trap focus and Escape returns to opener; workspace focus and names @cross-browser', async ({
  page,
}) => {
  await openProject(page);
  const before = await saved(page);
  const newButton = page.getByRole('banner').getByRole('button', { name: 'New', exact: true });
  await newButton.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Start a new project?', exact: true });
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 7; index++) {
    await page.keyboard.press('Tab');
    expect(
      await dialog.evaluate(
        (element) =>
          element.contains(document.activeElement) || document.activeElement === document.body,
      ),
      'modal never focuses an inert application control',
    ).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(newButton).toBeFocused();
  expect(await saved(page)).toEqual(before);
  await page.keyboard.press('Alt+Shift+Digit2');
  await expect(page.getByRole('heading', { name: 'Bindings', level: 1 })).toBeFocused();
  await page.keyboard.press('Alt+Shift+Digit1');
  await expect(page.getByRole('heading', { name: 'Schematic', level: 1 })).toBeFocused();
  await expect(history(page, 'Undo')).toBeDisabled();
});
