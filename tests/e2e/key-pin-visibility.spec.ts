import { expect, test } from './test';
import type { Page } from '@playwright/test';
import { buildProject } from '../helpers/build-project';
import { center, history, openProject, saved } from './helpers';

const source = buildProject({
  keys: [
    { id: 'k0', xU: 5, yU: 5 },
    { id: 'k1', xU: 6, yU: 5 },
    { id: 'k2', xU: 7, yU: 5 },
  ],
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`both pins remain drawn while a wire passes through the lower pin ${colorScheme} @cross-browser`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await openProject(page, source);
    await expectPins(page);
    const from = await center(pinDot(page, { keyId: 'k0', pin: 1 }));
    const to = await center(pinDot(page, { keyId: 'k2', pin: 1 }));
    await page.getByRole('radio', { name: 'Wire', exact: true }).press('Space');
    await page.mouse.click(from.x, from.y);
    await page.mouse.move(to.x, to.y);
    await expectPins(page);
    expect(await saved(page)).toEqual(source);
    await page.mouse.click(to.x, to.y);
    await expect.poll(async () => (await saved(page)).wires.length).toBe(1);
    await expectPins(page);
    const accepted = await saved(page);
    expect(accepted.wires[0]?.contacts).toEqual([
      { keyId: 'k1', pin: 1, at: { xU: 6.3, yU: 5.3667 } },
    ]);
    await page.screenshot({ path: test.info().outputPath(`connected-pins-${colorScheme}.png`) });
    const upperFrom = await center(pinDot(page, { keyId: 'k0', pin: 2 }));
    const upperTo = await center(pinDot(page, { keyId: 'k2', pin: 2 }));
    await page.mouse.click(upperFrom.x, upperFrom.y);
    await page.mouse.click(upperTo.x, upperTo.y);
    await expect.poll(async () => (await saved(page)).wires.length).toBe(2);
    await expectPins(page);
    const bothConnected = await saved(page);
    await history(page, 'Undo').click();
    expect(await saved(page)).toEqual(accepted);
    await expectPins(page);
    await history(page, 'Undo').click();
    await expectPins(page);
    expect(await saved(page)).toEqual(source);
    await history(page, 'Redo').click();
    await expectPins(page);
    expect(await saved(page)).toEqual(accepted);
    await history(page, 'Redo').click();
    expect(await saved(page)).toEqual(bothConnected);
    await expectPins(page);
  });
}

test('adding and removing a diode retains both visible key pins @cross-browser', async ({
  page,
}) => {
  await openProject(page, source);
  await page
    .getByRole('region', { name: 'Schematic editors', exact: true })
    .getByRole('button', { name: 'Add diode at key 1 pin 1', exact: true })
    .click();
  await expectPins(page);
  expect((await saved(page)).keys[1]?.diode).toEqual({ pin: 1, cathode: 'away-switch' });
  await history(page, 'Undo').click();
  await expectPins(page);
  expect(await saved(page)).toEqual(source);
});

function pinDot(page: Page, { keyId, pin }: { readonly keyId: string; readonly pin: 1 | 2 }) {
  return page
    .locator(
      `.joint-paper [model-id="pins:${keyId}"] g[data-key-id="${keyId}"][data-pin="${pin}"]:has(> text) > circle:not([stroke-width="0"])`,
    )
    .first();
}
async function expectPins(page: Page) {
  for (const keyId of ['k0', 'k1', 'k2']) {
    for (const pin of [1, 2] as const) {
      await expect(pinDot(page, { keyId, pin })).toBeVisible();
    }
  }
}
