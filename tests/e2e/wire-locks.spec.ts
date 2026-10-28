import { expect, test } from './test';
import {
  center,
  downloadJson,
  fixture,
  history,
  importText,
  key,
  openProject,
  saved,
  wiredFixture,
} from './helpers';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`wire lock pointer and keyboard history survives Save/Open in ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await openProject(page, wiredFixture);
    await page.getByRole('button', { name: 'Lock wire 0 on diagram', exact: true }).click();
    const locked = await saved(page);
    expect(locked.wires[0]?.locked).toBe(true);
    await expect(page.getByRole('button', { name: 'Unlock wire 0', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'Delete wire 0', exact: true }).click();
    expect(await saved(page)).toEqual(locked);
    await expect(
      page.getByText('Wire 0 is locked. Unlock it before changing this connection.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Find protecting wire 0' }).click();
    const unlock = page.getByRole('button', { name: 'Unlock wire 0', exact: true });
    await expect(unlock).toBeFocused();
    await page.screenshot({ path: test.info().outputPath('locked-wire.png'), fullPage: true });
    const json = await downloadJson(page);
    await unlock.press('Enter');
    expect((await saved(page)).wires[0]?.locked).toBeUndefined();
    await history(page, 'Undo').click();
    await expect.poll(() => saved(page)).toEqual(locked);
    await history(page, 'Redo').click();
    expect((await saved(page)).wires[0]?.locked).toBeUndefined();
    await page.screenshot({ path: test.info().outputPath('unlocked-wire.png'), fullPage: true });
    await importText(page, json);
    await expect.poll(() => saved(page)).toEqual(locked);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Unlock wire 0', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
}

test('protected mixed key gestures and bulk delete remain atomic until explicit unlock', async ({
  page,
}) => {
  await openProject(page, fixture);
  await page.getByRole('button', { name: 'Lock wire 0', exact: true }).click();
  const locked = await saved(page);
  await page.getByRole('checkbox', { name: 'Select key 0' }).check();
  await page.getByRole('checkbox', { name: 'Select key 1' }).check();
  await key(page, 0).press('Shift+ArrowRight');
  expect(await saved(page)).toEqual(locked);
  const at = await center(key(page, 0));
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await page.mouse.move(at.x + 48, at.y, { steps: 4 });
  await page.mouse.up();
  expect(await saved(page)).toEqual(locked);
  await page.getByRole('button', { name: 'Delete selected keys', exact: true }).click();
  expect(await saved(page)).toEqual(locked);
  await expect(page.getByRole('checkbox', { name: 'Select key 0' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Select key 1' })).toBeChecked();
  await page.getByRole('button', { name: 'Find protecting wire 0' }).click();
  await page.getByRole('button', { name: 'Unlock wire 0', exact: true }).press('Enter');
  await key(page, 0).press('Shift+ArrowRight');
  await expect
    .poll(async () => (await saved(page)).keys[0]?.xU)
    .toBeGreaterThan(fixture.keys[0]?.xU ?? 0);
  expect((await saved(page)).keys[1]).toEqual(fixture.keys[1]);
});
