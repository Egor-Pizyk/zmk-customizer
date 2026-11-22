import type { Page } from '@playwright/test';

export const EDITING_GROUPS = ['Keys', 'Wire sections', 'Wires', 'Crossings'];

export async function openPartsGroups(page: Page, groups: readonly string[] = EDITING_GROUPS) {
  if (groups.length === 0) {
    return;
  }
  const parts = page.getByRole('heading', { name: 'Parts', level: 2 });
  if ((await parts.count()) === 0) {
    return;
  }
  if (
    !(await parts
      .locator('..')
      .locator('..')
      .evaluate((element) => element.hasAttribute('open')))
  ) {
    await parts.locator('..').click();
  }
  for (const name of groups) {
    const heading = page.getByRole('heading', { name, level: 3, exact: true });
    const summary = heading.locator('..');
    if (!(await summary.locator('..').evaluate((element) => element.hasAttribute('open')))) {
      await summary.click();
    }
  }
}
