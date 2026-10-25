import { expect, test } from './test';
import { buildConnectedMatrix } from '../helpers/connected-matrix';
import { center, history, key, openProject, saved } from './helpers';

for (const delta of [-48, 48]) {
  test(`hand-drawn 2×2 moves horizontally ${delta} with its connections @cross-browser`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: delta > 0 ? 'dark' : 'light' });
    const project = buildConnectedMatrix();
    await openProject(page, project);
    const start = await center(key(page, 1));
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + delta, start.y, { steps: 4 });
    expect(await saved(page)).toEqual(project);
    await page.mouse.up();
    await expect.poll(async () => (await saved(page)).keys[1]?.xU).toBe(7 + delta / 48);
    const moved = await saved(page);
    expect(moved.wires).toEqual(project.wires);
    expect(moved.insulatedCrossings).toEqual(
      delta > 0 ? [{ wireIds: ['w2', 'w5'], ordinal: 0 }] : [],
    );
    const painted = await center(key(page, 1));
    expect(painted.x - start.x).toBeCloseTo(delta, 0);
    expect(painted.y).toBeCloseTo(start.y, 0);
    await page.screenshot({ path: test.info().outputPath('connected-key-moved.png') });
    await history(page, 'Undo').click();
    await expect.poll(() => saved(page)).toEqual(project);
    await history(page, 'Redo').click();
    await expect.poll(() => saved(page)).toEqual(moved);
    const next = await center(key(page, 1));
    await page.mouse.move(next.x, next.y);
    await page.mouse.down();
    await page.mouse.move(next.x, next.y - 48, { steps: 4 });
    await page.keyboard.press('Escape');
    await page.mouse.up();
    expect(await saved(page)).toEqual(moved);
    await page.reload();
    expect(await saved(page)).toEqual(moved);
    const target = key(page, 1);
    await target.focus();
    await target.press('Shift+ArrowRight');
    await expect.poll(async () => (await saved(page)).keys[1]?.xU).toBeGreaterThan(7 + delta / 48);
  });
}
