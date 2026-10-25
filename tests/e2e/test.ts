import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';
// Existing editor journeys dismiss first-visit help through the real UI. Dedicated
// onboarding specs use the base fixture so first display remains under test.
export const test = base.extend({
  page: async ({ page }, providePage) => {
    await page.addLocatorHandler(
      page.getByRole('dialog', { name: 'Learn ZMK Customizer' }),
      async () => {
        await page
          .getByRole('dialog', { name: 'Learn ZMK Customizer' })
          .getByRole('button', { name: 'Skip tour', exact: true })
          .click();
      },
    );
    await providePage(page);
  },
});
