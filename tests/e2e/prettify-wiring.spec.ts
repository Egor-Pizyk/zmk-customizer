import { expect, test } from './test';
import { buildProject, freeEnd, keyPin } from '../helpers/build-project';
import { downloadJson, history, importText, openProject, saved } from './helpers';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Prettify preserves incomplete wiring and locks through history and Save/Open ${colorScheme} @cross-browser`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width: 1024, height: 768 });
    const source = sample();
    await openProject(page, source);
    await page.getByText('Wiring', { exact: true }).click();
    await page.context().setOffline(true);
    await page.getByRole('button', { name: 'Prettify', exact: true }).click();
    const apply = page.getByRole('button', { name: 'Apply wiring', exact: true });
    await expect(apply).toBeEnabled();
    await expect(apply).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: test.info().outputPath(`prettify-${colorScheme}.png`) });
    expect(await saved(page)).toEqual(source);
    await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
    await expect(history(page, 'Undo')).toBeDisabled();
    await page.getByRole('button', { name: 'Prettify', exact: true }).click();
    await expect(apply).toBeEnabled();
    await apply.click();
    const accepted = await saved(page);
    expect(accepted.wires[0]?.bends).toEqual([{ xU: 4, yU: 0.3667 }]);
    expect(accepted.wires[1]).toEqual(source.wires[1]);
    expect(accepted.wires).toHaveLength(2);
    expect(accepted.keys).toEqual(source.keys);
    await page.getByRole('button', { name: 'Prettify', exact: true }).click();
    await expect(page.getByText('No wiring changes needed.', { exact: true })).toBeVisible();
    await expect(apply).toBeDisabled();
    await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
    await history(page, 'Undo').click();
    expect(await saved(page)).toEqual(source);
    await history(page, 'Redo').click();
    expect(await saved(page)).toEqual(accepted);
    const json = await downloadJson(page);
    await importText(page, json);
    expect(await saved(page)).toEqual(accepted);
    await page.context().setOffline(false);
    await page.reload();
    expect(await saved(page)).toEqual(accepted);
  });
}

test('Prettify replaces a pending generation without accepting proposed connections', async ({
  page,
}) => {
  const source = buildProject({ keys: [{ id: 'k0', xU: 0, yU: 0 }] });
  await openProject(page, source);
  await page.getByText('Wiring', { exact: true }).click();
  await page.getByRole('button', { name: 'Generate wiring', exact: true }).click();
  const apply = page.getByRole('button', { name: 'Apply wiring', exact: true });
  await expect(apply).toBeEnabled();
  await page.getByRole('button', { name: 'Prettify', exact: true }).click();
  await expect(
    page.getByText('No wires to prettify. Generate or draw wiring first.', { exact: true }),
  ).toBeVisible();
  await expect(apply).toBeDisabled();
  expect(await saved(page)).toEqual(source);
  await page.getByRole('button', { name: 'Cancel wiring', exact: true }).click();
  await expect(history(page, 'Undo')).toBeDisabled();
});

function sample() {
  return buildProject({
    keys: [{ id: 'k0', xU: 0, yU: 0 }],
    wires: [
      {
        id: 'w0',
        start: keyPin('k0', 1),
        end: freeEnd(4, 2, 2),
        bends: [
          { xU: 0.3, yU: 1 },
          { xU: 4, yU: 1 },
        ],
      },
      {
        id: 'w1',
        start: freeEnd(6, 0),
        end: freeEnd(7, 2),
        locked: true,
        bends: [{ xU: 6, yU: 2 }],
      },
    ],
  });
}
