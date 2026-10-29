import { expect, test } from './test';
import { buildProject } from '../helpers/build-project';
import { history, openProject, saved } from './helpers';

test('first routing Worker and restart after Cancel work offline with one accepted history step', async ({
  page,
}) => {
  const source = buildProject({
    keys: Array.from({ length: 64 }, (_, index) => ({
      id: `k${index}`,
      xU: 3 + (index % 8),
      yU: 3 + Math.floor(index / 8),
    })),
  });
  await openProject(page, source);
  await page.getByText('Wiring', { exact: true }).click();
  const workerUrls: string[] = [];
  page.on('worker', (worker) => {
    workerUrls.push(worker.url());
  });
  await page.context().setOffline(true);
  await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
  await expect(page.getByText('Calculating wiring…', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
  expect(await saved(page)).toEqual(source);
  await expect(history(page, 'Undo')).toBeDisabled();
  await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
  const apply = page.getByRole('button', { name: 'Apply wiring', exact: true });
  await expect(apply).toBeEnabled({ timeout: 20_000 });
  await page.screenshot({ path: test.info().outputPath('offline-preview.png'), fullPage: true });
  await apply.click();
  const accepted = await saved(page);
  expect(accepted.wires).toHaveLength(80);
  expect(workerUrls.length).toBeGreaterThanOrEqual(2);
  expect(workerUrls.every((url) => url.startsWith('blob:'))).toBe(true);
  await history(page, 'Undo').click();
  await expect.poll(() => saved(page)).toEqual(source);
  await history(page, 'Redo').click();
  await expect.poll(() => saved(page)).toEqual(accepted);
});

test('editing and Undo keep the previous Worker proposal stale until explicit recalculation', async ({
  page,
}) => {
  const source = buildProject({ keys: [{ id: 'k0', xU: 3, yU: 3 }] });
  await openProject(page, source);
  await page.getByText('Wiring', { exact: true }).click();
  await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
  const apply = page.getByRole('button', { name: 'Apply wiring', exact: true });
  await expect(apply).toBeEnabled();
  const name = page.getByRole('textbox', { name: 'Name', exact: true });
  await name.fill('Changed');
  await name.press('Enter');
  await expect(apply).toBeDisabled();
  await history(page, 'Undo').click();
  await expect.poll(() => saved(page)).toEqual(source);
  await expect(apply).toBeDisabled();
  await expect(page.getByRole('alert')).toHaveText(
    'The project changed. Recalculate the wiring preview.',
  );
  await page.screenshot({ path: test.info().outputPath('stale-preview.png'), fullPage: true });
  await page.getByRole('button', { name: 'Recalculate wiring', exact: true }).click();
  await expect(apply).toBeEnabled();
  await apply.click();
  expect((await saved(page)).wires).toHaveLength(3);
});

test('a real no-change Worker reply does not autosave or add history', async ({ page }) => {
  await page.addInitScript(() => {
    // oxlint-disable-next-line typescript/unbound-method -- The native receiver is preserved explicitly with original.call(this, ...).
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItem(key: string, value: string) {
      if (key === 'zmk-customizer:project') {
        performance.mark('project-autosave');
      }
      original.call(this, key, value);
    };
  });
  const source = {
    ...buildProject({ keys: [{ id: 'k0', xU: 3, yU: 3 }] }),
    wiring: { kind: 'matrix', topology: 'unibody', diodeDirection: 'col2row', terminals: [] },
  } as const;
  await openProject(page, source);
  await page.getByText('Wiring', { exact: true }).click();
  const before = await page.evaluate(() => performance.getEntriesByName('project-autosave').length);
  await page.context().setOffline(true);
  await page
    .getByRole('combobox', { name: 'Diode direction', exact: true })
    .selectOption('col2row');
  await expect(page.getByText('No wiring changes needed.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apply wiring', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
  expect(await page.evaluate(() => performance.getEntriesByName('project-autosave').length)).toBe(
    before,
  );
  expect(await saved(page)).toEqual(source);
  await expect(history(page, 'Undo')).toBeDisabled();
});
