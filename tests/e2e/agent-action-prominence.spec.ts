import { expect, test } from './test';
import { fixture, openProject, saved, history } from './helpers';

for (const theme of ['light', 'dark'] as const) {
  test(`agent action placement and keyboard ${theme} @cross-browser`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await openProject(page);
    const header = page.getByRole('banner');
    const agent = header.getByRole('button', { name: 'Create with agent', exact: true });
    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(header.getByRole('button').last()).toHaveAccessibleName('Create with agent');
      await expect(agent.getByText('AI', { exact: true })).toBeVisible();
      const agentBounds = await agent.boundingBox();
      const redoBounds = await history(page, 'Redo').boundingBox();
      expect(agentBounds).not.toBeNull();
      expect(redoBounds).not.toBeNull();
      expect(agentBounds?.y).toBeGreaterThanOrEqual(redoBounds?.y ?? 0);
      if (agentBounds?.y === redoBounds?.y) {
        expect(agentBounds?.x).toBeGreaterThan(redoBounds?.x ?? 0);
      }
      expect((agentBounds?.x ?? 0) + (agentBounds?.width ?? 0)).toBeGreaterThan(width - 24);
      expect((agentBounds?.x ?? 0) + (agentBounds?.width ?? 0)).toBeLessThanOrEqual(width);
      await history(page, 'Redo').focus();
      await page.keyboard.press('Tab');
      await expect(agent).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(
        page.getByRole('dialog', { name: 'Create with agent', exact: true }),
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(agent).toBeFocused();
      await header.screenshot({ path: test.info().outputPath(`agent-${width}.png`) });
    }
    expect(await saved(page)).toEqual(fixture);
    await expect(history(page, 'Undo')).toHaveAttribute('aria-disabled', 'true');
  });
}

test('agent action available before creating keys @cross-browser', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create with agent', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Create with agent', exact: true })).toBeVisible();
});
