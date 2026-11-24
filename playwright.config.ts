import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5000 },
  forbidOnly: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4175',
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'firefox',
      grep: /@cross-browser/u,
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'webkit',
      grep: /@cross-browser/u,
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 0.0.0.0 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    env: {
      VITE_GITHUB_AUTH_URL: 'http://127.0.0.1:4175/github-test-auth',
      VITE_GITHUB_APP_SLUG: 'zmk-customizer-test',
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
