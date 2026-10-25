import { test } from '@playwright/test';
import { runOnboardingExercise } from './onboarding-exercise';

test('onboarding keyboard-only empty project through nine keys to matching ZIP', async ({
  page,
}, info) => {
  test.setTimeout(120_000);
  await runOnboardingExercise(page, info, true);
});
