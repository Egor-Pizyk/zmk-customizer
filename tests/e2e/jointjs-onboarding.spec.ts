import { expect, test } from '@playwright/test';
import { continueOnboardingExercise } from './onboarding-exercise';

test('loaded application completes protected 3×3 learning and actual ZIP offline', async ({
  page,
  context,
}, info) => {
  test.setTimeout(120_000);
  const networkOrigins = new Set<string>();
  context.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      networkOrigins.add(url.origin);
    }
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Start empty learning project', exact: true }).waitFor();
  await context.setOffline(true);
  await continueOnboardingExercise(page, info, true);
  expect([...networkOrigins]).toEqual([new URL(page.url()).origin]);
});
