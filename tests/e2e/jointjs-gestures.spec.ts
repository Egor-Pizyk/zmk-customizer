import { expect, test } from './test';
import {
  beginDrag,
  center,
  history,
  key,
  openProject,
  saved,
  editNumber,
  expectGeometry,
} from './helpers';

for (const interruption of ['Escape', 'UndoRedo', 'New', 'Open'] as const) {
  test(`obsolete drag cannot commit after ${interruption} @cross-browser`, async ({ page }) => {
    await openProject(page);
    await editNumber(page, 'Key 0 X (u)', '5.25');
    const before = await saved(page);
    const start = await center(key(page));
    await beginDrag(page, start, { x: start.x + 48, y: start.y + 48 });
    expect(await saved(page)).toEqual(before);
    if (interruption === 'Escape') {
      await page.keyboard.press('Escape');
    }
    if (interruption === 'UndoRedo') {
      await page.keyboard.press('ControlOrMeta+z');
      await page.keyboard.press('ControlOrMeta+Shift+z');
    }
    if (interruption === 'New') {
      await page.getByRole('banner').getByRole('button', { name: 'New', exact: true }).focus();
      await page.keyboard.press('Enter');
      await page.getByRole('button', { name: 'Start empty project', exact: true }).press('Enter');
    }
    if (interruption === 'Open') {
      const replacement = {
        ...before,
        name: 'Replacement',
        keys: before.keys.map((entry) => ({ ...entry, xU: entry.xU + 2 })),
      };
      await page.getByRole('banner').getByRole('button', { name: 'Open', exact: true }).focus();
      await page.keyboard.press('Enter');
      const chooser = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: 'Choose file…', exact: true }).press('Enter');
      await (
        await chooser
      ).setFiles({
        name: 'replacement.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(replacement)),
      });
      await expect.poll(() => saved(page)).toEqual(replacement);
    }
    const accepted = await saved(page);
    if (interruption === 'Escape' || interruption === 'UndoRedo') {
      await expectGeometry(page, before.keys[0] ?? { id: 'k0', xU: 5.25, yU: 5 });
    }
    await page.mouse.move(start.x + 60, start.y + 60);
    await page.mouse.up();
    await page.mouse.up();
    expect(await saved(page)).toEqual(accepted);
    if (interruption === 'Escape' || interruption === 'UndoRedo') {
      expect(accepted).toEqual(before);
      await history(page, 'Undo').click();
      expect((await saved(page)).keys[0]?.xU).toBe(5);
    }
  });
}

test('completed drag has exact single-step Undo/Redo and no extra release save', async ({
  page,
}) => {
  await openProject(page);
  const before = await saved(page);
  const start = await center(key(page));
  await beginDrag(page, start, { x: start.x + 48, y: start.y + 48 });
  expect(await saved(page)).toEqual(before);
  await page.mouse.up();
  const moved = await saved(page);
  expect(moved.keys[0]).toMatchObject({ xU: 6, yU: 6 });
  await page.mouse.up();
  expect(await saved(page)).toEqual(moved);
  await history(page, 'Undo').click();
  expect(await saved(page)).toEqual(before);
  await history(page, 'Redo').click();
  expect(await saved(page)).toEqual(moved);
});
