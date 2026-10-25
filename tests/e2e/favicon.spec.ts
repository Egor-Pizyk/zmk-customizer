import { expect, test } from '@playwright/test';

test('browser tab declares a bundled SVG favicon @cross-browser', async ({ page }) => {
  await page.goto('/');
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveAttribute('href', '/favicon.svg');
  await expect(icon).toHaveAttribute('type', 'image/svg+xml');
  const response = await page.request.get('/favicon.svg');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('image/svg+xml');
  expect(await response.text()).toContain('<svg');
  await page.reload();
  await expect(icon).toHaveAttribute('href', '/favicon.svg');
  await page.setViewportSize({ width: 32, height: 32 });
  await page.goto('/favicon.svg');
  await expect(page.locator('svg')).toBeVisible();
  await page.screenshot({ path: 'test-results/favicon-preview.png' });
});
