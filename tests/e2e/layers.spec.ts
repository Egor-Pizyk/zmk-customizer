import { expect, test } from './test';
import { fixture, history, openProject, saved, workspace } from './helpers';

test('32-layer limit, tab navigation and history preserve saved layers @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await openProject(page, { ...fixture, layers: fixture.layers.slice(0, 1) });
  await workspace(page, 'Bindings');
  const layers = page.getByRole('region', { name: 'Layers', exact: true });
  const add = layers.getByRole('button', { name: /^Add layer/u });
  const name = layers.getByRole('textbox', { name: 'Layer name', exact: true });
  const panel = page.getByRole('tabpanel');
  const baseline = await Promise.all([add.boundingBox(), name.boundingBox(), panel.boundingBox()]);
  for (let count = 2; count <= 32; count += 1) {
    await add.click();
    await expect(layers.getByRole('tab')).toHaveCount(count);
    expect(await Promise.all([add.boundingBox(), name.boundingBox(), panel.boundingBox()])).toEqual(
      baseline,
    );
    const selected = layers.getByRole('tab', { selected: true });
    await expect(selected).toBeInViewport({ ratio: 1 });
    await expect(add).toBeFocused();
  }
  await expect(add).toHaveAttribute('aria-disabled', 'true');
  const longName = 'W'.repeat(19);
  await name.fill(longName);
  await name.press('Enter');
  const last = layers.getByRole('tab', { name: `31 ${longName}`, exact: true });
  await expect(last).toHaveAttribute('title', `31 ${longName}`);
  await expect(last).toBeInViewport({ ratio: 1 });
  expect(await panel.boundingBox()).toEqual(baseline[2]);
  expect((await saved(page)).layers[31]?.name).toBe(longName);
  await last.focus();
  await last.press('Home');
  const first = layers.getByRole('tab').first();
  await expect(first).toBeFocused();
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await expect(first).toBeInViewport({ ratio: 1 });
  await first.press('End');
  await expect(last).toBeFocused();
  await expect(last).toBeInViewport({ ratio: 1 });
  await layers.getByRole('button', { name: 'Move left', exact: true }).click();
  await expect(layers.getByRole('tab', { selected: true })).toHaveText(`30 ${longName}`);
  await layers.getByRole('button', { name: 'Delete layer', exact: true }).click();
  await expect(layers.getByRole('tab')).toHaveCount(31);
  await history(page, 'Undo').click();
  await expect(layers.getByRole('tab', { selected: true })).toHaveText(`30 ${longName}`);
  await history(page, 'Redo').click();
  await expect(layers.getByRole('tab')).toHaveCount(31);
  await history(page, 'Redo').press('Escape');
  expect(await panel.boundingBox()).toEqual(baseline[2]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
