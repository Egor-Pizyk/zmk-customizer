import { expect, test } from './test';
import {
  fixture,
  history,
  key,
  openProject,
  saved,
  selectKey,
  expectGeometry,
  importText,
} from './helpers';

for (const modifier of ['Meta', 'Control']) {
  test(`${modifier} copies Schematic key snapshots and keeps text editing native @cross-browser`, async ({
    page,
  }) => {
    await openProject(page);
    await selectKey(page);
    await key(page).focus();
    const before = await saved(page);
    await page.keyboard.press(`${modifier}+KeyC`);
    expect(await saved(page)).toEqual(before);
    await page.keyboard.press('Delete');
    await expect.poll(async () => (await saved(page)).keys.length).toBe(1);
    await key(page, 0).focus();
    await page.keyboard.press(`${modifier}+KeyV`);
    await expect.poll(async () => (await saved(page)).keys.length).toBe(2);
    const pasted = await saved(page);
    expect(pasted.keys[1]).toMatchObject({
      id: 'k2',
      xU: 12,
      yU: 5,
      diode: fixture.keys[0]?.diode,
    });
    expect(pasted.layers[0]?.bindings['k2']).toEqual(fixture.layers[0]?.bindings['k0']);
    expect(pasted.layers[1]?.bindings['k2']).toEqual(fixture.layers[1]?.bindings['k0']);
    expect(pasted.wires).toHaveLength(0);
    await expectGeometry(page, pasted.keys[1] ?? { id: 'missing', xU: 0, yU: 0 }, 1);
    await history(page, 'Undo').click();
    await expect.poll(async () => (await saved(page)).keys.length).toBe(1);
    await history(page, 'Redo').click();
    expect(await saved(page)).toEqual(pasted);
    const name = page.getByRole('textbox', { name: 'Name', exact: true });
    await name.focus();
    await name.press('Home');
    await name.press('Shift+End');
    await page.keyboard.press(`${modifier}+KeyC`);
    await page.keyboard.press(`${modifier}+KeyV`);
    expect((await saved(page)).keys).toEqual(pasted.keys);
    await page.reload();
    expect(await saved(page)).toEqual(pasted);
  });
}

test('table multi-copy, preview guard, empty buffer and project replacement', async ({ page }) => {
  await openProject(page);
  await key(page).focus();
  await page.keyboard.press('Meta+KeyV');
  expect(await saved(page)).toEqual(fixture);
  await expect(page.getByRole('status')).toContainText('Copy ordinary keys');
  const first = page.getByRole('checkbox', { name: 'Select key 0', exact: true });
  const second = page.getByRole('checkbox', { name: 'Select key 1', exact: true });
  await first.check();
  await second.check();
  await second.focus();
  await page.keyboard.press('Meta+KeyC');
  await page.keyboard.press('Meta+Shift+KeyV');
  expect(await saved(page)).toEqual(fixture);
  await page.getByText('Precise properties', { exact: true }).click();
  const rotation = page.getByRole('spinbutton', { name: 'Selected rotation (°)', exact: true });
  await rotation.fill('15');
  await rotation.press('Enter');
  await key(page).focus();
  await page.keyboard.press('Meta+KeyV');
  expect(await saved(page)).toEqual(fixture);
  await expect(page.getByRole('status')).toContainText('Apply or cancel');
  await page.getByRole('button', { name: 'Cancel preview', exact: true }).click();
  await key(page).focus();
  await page.keyboard.press('Meta+KeyV');
  await expect.poll(async () => (await saved(page)).keys.length).toBe(4);
  const pasted = await saved(page);
  expect(pasted.keys.slice(2).map((entry) => entry.xU)).toEqual([12, 17]);
  expect(pasted.wires).toEqual(fixture.wires);
  await page.screenshot({ path: '.check-logs/item18-light.png' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: '.check-logs/item18-dark.png' });
  await importText(page, JSON.stringify(fixture));
  await expect.poll(() => saved(page)).toEqual(fixture);
  await key(page).focus();
  await page.keyboard.press('Meta+KeyV');
  expect(await saved(page)).toEqual(fixture);
});

test('Bindings retains Meta action clipboard and native text copy/paste', async ({ page }) => {
  await openProject(page);
  await page.getByRole('button', { name: /^Bindings/u }).click();
  await key(page).click();
  await key(page).focus();
  await page.keyboard.press('Meta+KeyC');
  await key(page, 1).click();
  await key(page, 1).focus();
  await page.keyboard.press('Meta+KeyV');
  const pasted = await saved(page);
  expect(pasted.keys).toEqual(fixture.keys);
  expect(pasted.layers[0]?.bindings['k1']).toEqual(fixture.layers[0]?.bindings['k0']);
  expect(pasted.layers[1]).toEqual(fixture.layers[1]);
  const name = page.getByRole('textbox', { name: 'Name', exact: true });
  await name.fill('Native text');
  const nativeModifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await name.press(`${nativeModifier}+KeyA`);
  await name.press(`${nativeModifier}+KeyC`);
  await name.press('ArrowRight');
  await name.press(`${nativeModifier}+KeyV`);
  await expect(name).toHaveValue('Native textNative text');
  expect((await saved(page)).keys).toEqual(fixture.keys);
});
